# CoCanvas Backend ⚙️

Welcome to the comprehensive backend engineering reference for **CoCanvas**. This document details the REST API specifications, real-time WebSocket communication contracts, Mongoose database models, and transactional email workflows.

---

## 💾 MongoDB Database Models (Mongoose Schemas)

The application uses three primary Mongoose collections:

### 1. User (`models/User.js`)
Stores user profiles, password hashes, and registration/activation metadata.
```javascript
{
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profileImage: String,
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Team (`models/Team.js`)
Maintains team memberships, workspace descriptions, invite states, and notification backlogs.
```javascript
{
  name: { type: String, required: true, unique: true },
  description: String,
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  requests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  notifications: [{
    type: { type: String, enum: ['JOIN_REQUEST', 'REQUEST_ACCEPTED', 'KICKED'] },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
}
```

### 3. SessionData (`models/SessionData.js`)
Caches real-time canvas vector board drawings and conversation chat message records.
```javascript
{
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', unique: true },
  teamName: String,
  drawingData: { type: Array, default: [] },  // Holds Excalidraw element models
  chatHistory: [{
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  canvasWidth: { type: Number, default: 1920 },
  canvasHeight: { type: Number, default: 1080 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastModified: { type: Date, default: Date.now }
}
```

---

## 📡 REST API Specifications

All endpoints are prefixed with `/api`. Protected routes require a valid JSON Web Token injected into the `Authorization: Bearer <token>` header.

### 🛡️ Authentication Routes (`/api/auth`)

| Endpoint | Method | Security | Request Payload | Description |
|---|---|---|---|---|
| `/register` | POST | Rate Limited | `{ username, email, password }` | Registers a new account, generates secure bcrypt passwords, generates a dynamic JWT activation token, and emails the user their custom glassmorphic verification email via Resend. |
| `/login` | POST | Rate Limited | `{ email, password }` | Authenticates credentials and returns a secure JWT `accessToken` along with a `refreshToken` and user profile details. |
| `/logout` | POST | Protected | None | Logs out the user and clears active backend token records. |
| `/forgot-password`| POST | Rate Limited | `{ email }` | Triggers a secure password reset flow. Sends a cryptographically secure token url in a beautiful HTML email via the Resend API. |
| `/reset-password/:token`| POST | None | `{ password }` | Verifies the crypto token and resets the database password hash with a new salted bcrypt key. |
| `/verify-email/:token`| GET | None | Params Token | Verifies the JWT registration token and updates the User's `isVerified` flag to `true` in MongoDB, then redirects them to the frontend dashboard. |
| `/me` | GET | Protected | None | Returns the currently authenticated user's profile metadata. |
| `/change-password` | POST | Protected | `{ oldPassword, newPassword }` | Authenticates the old password, validates password constraints, and updates the profile with the new encrypted hash. |
| `/refresh-token` | POST | None | `{ token }` | Grants a new 15-minute `accessToken` using a valid long-lived `refreshToken`. |
| `/resend-verification-email`| POST | None | `{ email }` | Generates a fresh verification token and resends the activation email to the user's inbox. |
| `/update-profile` | PUT | Protected | `{ username, profileImage }` | Updates the active user profile details in MongoDB. |
| `/delete-account` | DELETE | Protected | None | Completely removes the user record and associated team settings from the database permanently. |

### 👥 Team & Workspace Routes (`/api/teams`)

| Endpoint | Method | Security | Request Payload | Description |
|---|---|---|---|---|
| `/create` | POST | Protected | `{ name, description }` | Creates a new Team document with the active user set as the Administrator. |
| `/join` | POST | Protected | `{ teamName }` | Searches for the team by name. If found, pushes the User's ID into the team's `requests` array and broadcasts a live WebSocket notification to the administrator. |
| `/my-teams` | GET | Protected | None | Returns a complete list of teams where the user is either the administrator or a member. |
| `/notifications` | GET | Protected | None | Returns the active notification queue for the user's teams. |
| `/edit-description`| POST | Protected | `{ teamId, description }` | Updates the workspace description (Restrictive: Admin only). |
| `/delete` | POST | Protected | `{ teamId }` | Completely purges the team and its associated canvas board `SessionData` from MongoDB (Admin only). |
| `/:teamId` | GET | Protected | Params ID | Returns comprehensive detail for a team workspace, including the complete members array. |
| `/handle-request` | POST | Protected | `{ teamId, userId, action }` | Approves or rejects a user's join request. Action can be `'ACCEPT'` (adds them to the `members` list) or `'REJECT'`. |
| `/kick` | POST | Protected | `{ teamId, memberId }` | Evicts a member from the workspace (Admin only). |

---

## 🔌 Socket.io Real-time WebSocket Protocol

WebSockets synchronize user canvas interactions and session communication instantly. Sockets bind to the http server on port `3000` (or `process.env.PORT` on cloud hosts).

### Sockets Payload Contracts:

#### 1. Inbound Events (Client ➡️ Server)
* **`register-user` (userId)**: Associates the connected socket client with a Mongoose User ID to track user identities.
* **`start-team-session` ({ teamId, teamName })**: Initiates a collaborative live whiteboard room. Broadcasts a notification to all active team members online.
* **`join-session` ({ sessionId, username, userId })**: Connects a user's viewport to an active canvas room. Pulls elements and chat records from MongoDB and delivers them as a sync payload.
* **`draw` ({ sessionId, elements })**: Transmits updated Excalidraw vector shapes. Relays payload instantly to all other sockets in the room.
* **`chat-message` ({ sessionId, message, username })**: Transmits a new message. Appends the text to the session's chat history database and broadcasts it in the room.
* **`request-join` ({ sessionId, userId, username })**: Used when drawing permissions are locked. Requests the administrator's permission to join or draw.
* **`grant-request` ({ sessionId, userId, approve })**: Broadcast by the admin to allow or block a drawing request.
* **`leave-session` (sessionId)**: Cleanly disconnects the socket from the canvas room.
* **`terminate-session` (sessionId)**: Manual termination by the admin. Auto-saves the final vector states and chat history to Mongoose, broadcasts a termination event, and disconnects all sockets.

#### 2. Outbound Events (Server ➡️ Client)
* **`team-session-started` ({ sessionId, teamName })**: Informs team members that their workspace whiteboard is now active.
* **`user-joined` ({ username, userId, count })**: Displays a small banner indicating a user has joined the canvas.
* **`user-left` (socketId)**: Notifies the room that a member disconnected.
* **`draw` (elements)**: Synchronizes drawing layouts across canvas viewports.
* **`chat-message` ({ username, message, timestamp })**: Appends a new chat bubble in real time.
* **`session-terminated` ({ message })**: Displays an overlay locking the Excalidraw UI and cleanly redirecting users.

---

## 📧 Transactional Resend Email Flow

CoCanvas has replaced deprecated, unsecure SMTP transporters with a professional, secure **Resend API SDK** integration.

```
┌──────────────────────┐
│  Controller Method   │ (authController.js)
└──────────┬───────────┘
           │ (Compiles Custom Glassmorphic HTML Template)
           ▼
┌──────────────────────┐
│  Resend Client SDK   │ (resend.emails.send())
└──────────┬───────────┘
           │ (HTTPS Post Request securely to API Gateway)
           ▼
┌──────────────────────┐
│      Resend API      │ (Validates Domain & SPF/DKIM keys)
└──────────┬───────────┘
           │ (Sends to User Inbox)
           ▼
┌──────────────────────┐
│      User Inbox      │ (Perfect Inbox Delivery!)
└──────────────────────┘
```

* **Security**: All API keys are loaded via the `RESEND_API_KEY` system environment variable, ensuring zero credential exposures.
* **Fallback & Redirects**: Verification and password reset email links parse `process.env.FRONTEND_URL` (local or Vercel URL) to redirect users safely back to the correct login panel with a clean feedback alert.
