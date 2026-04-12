# Canvas Collaboration App - Unified Backend

A production-ready server that serves **both** a comprehensive REST API and a real-time WebSocket backend simultaneously on a single port. Built with **Node.js, Express, Socket.io, MongoDB, and JWT**.

---

## 🚀 Overview & Architecture

To keep hosting simple and affordable, the original authentication API and real-time socket server have been **merged** into this unified backend. 

### 1. The REST API (Express)
Handles all stateless interactions:
- **Authentication**: JWT-based login, registration with email verification (nodemailer), password resets, and user management (`/api/auth/*`).
- **Team Management**: Creating teams, managing team members, and accepting join requests (`/api/teams/*`).

### 2. The Real-Time Server (Socket.io)
Handles the live collaborative features of the canvas application:
- **Live Canvas Drawing**: High-frequency coordinate broadcasting to team members in a specific session room.
- **Persistent Chat**: Live messaging parallel to drawing sessions.
- **Team Invites (Live Notifications)**: An admin can dispatch immediate "Session Started" prompts directly into team members' clients via `user_room` socket channels.

---

## 📋 Table of Contents

1. [Installation & Setup](#installation)
2. [Environment Setup](#environment-setup)
3. [REST API Features Sandbox](#rest-api)
4. [WebSocket (Real-Time) Features Sandbox](#websocket-events)
5. [Project Structure](#project-structure)

---

## 🔧 Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- Gmail account (for email verification emails)

### Standard Local Run

1. **Navigate to the backend directory**
   ```bash
   cd canvas/backend
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Create the `.env` file** in the root directory
   ```env
   JWT_SECRET=your-secret-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   MONGODB_URI=mongodb://localhost:27017/canvas
   ```

4. **Start the server**
   ```bash
   node server.js
   ```
   The unified server will run on `http://localhost:3000`.

### Docker Run
A `Dockerfile` is included for rapid deployment.
1. Build it: `docker build -t mybackend .`
2. Run it: `docker run -d -p 3000:3000 --name authserver mybackend`

---

## 📡 REST API Structure

Base URL: `http://localhost:3000/api`

- **Auth Endpoints (`/api/auth/`)**:
  - `POST /register`: Accepts name, email, password. Validates inputs & shoots an email link.
  - `POST /login`: Returns an Access Token (15m) & Refresh Token (7d).
  - `GET /verify-email/:token`: Validates email before allowing login.
  - `GET /me`: Returns the user details, given the Bearer Token.
- **Team Endpoints (`/api/teams/`)**:
  - Used for creating, deleting, and appending members to teams for session invites.

---

## 🔌 WebSocket Events Structure

All socket-based logic resides at the bottom of `server.js` under the `io.on("connection")` block.

### Connecting
- A client attempts `io("http://localhost:3000")`.
- Once connected, the frontend fires `socket.emit("register-user", userId)` to ensure they occupy a specific user room (`user_room_<userId>`) for private team notifications.

### Session Initialization & Invites
- **`create-session`**: Triggered by an admin, creates a new unique session lobby in the server's cache (`sessions` Map).
- **`invite-team-to-session`**: Admin emits this alongside an array of `members`. The server iterates through the members and forcibly pushes a notification into their specific user rooms to inform them the lobby is open.

### Collaboration Phase
- **`draw` & `cursor-move`**: High velocity traffic. Receives standard JSON data representing coordinate arrays and instantly shouts it to `socket.to(data.sessionId)`.
- **`send-chat`**: Shunts incoming chat strings to `receive-chat` for all room inhabitants, verifying permissions set by the admin beforehand.

---

### 4. **Get Current User Profile**
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /me` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "isVerified": true,
  "createdAt": "2026-02-14T10:30:00.000Z",
  "updatedAt": "2026-02-14T10:30:00.000Z"
}
```

---

### 5. **Change Password**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /change-password` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Validation:**
- Current password must be correct
- New password must meet strength requirements

---

### 6. **Forgot Password**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /forgot-password` |
| **Authentication** | ❌ Not required |
| **Rate Limit** | 5 requests per hour |

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset link sent to email"
}
```

**Note:** User receives an email with a reset link (valid for 1 hour)

---

### 7. **Reset Password (GET Form)**
| Property | Value |
|----------|-------|
| **Endpoint** | `GET /reset-password/:token` |
| **Authentication** | ❌ Not required |

**Response:** HTML form for entering new password

**Note:** Token comes from the email link

---

### 8. **Reset Password (POST)**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /reset-password/:token` |
| **Authentication** | ❌ Not required |

**Request Body:**
```json
{
  "password": "NewPassword@789"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

---

### 9. **Refresh Access Token**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /refresh-token` |
| **Authentication** | ❌ Not required |

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use Case:** When your access token expires after 15 minutes

---

### 10. **Resend Verification Email**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /resend-verification-email` |
| **Authentication** | ❌ Not required |

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

**Error:** Returns 400 if email is already verified

---

### 11. **Update User Profile**
| Property | Value |
|----------|-------|
| **Endpoint** | `PUT /update-profile` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "message": "Profile updated. Please verify your new email.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

**Note:** If email is changed, user must verify the new email before next login

---

### 12. **Delete Account**
| Property | Value |
|----------|-------|
| **Endpoint** | `DELETE /delete-account` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "password": "CurrentPassword@123"
}
```

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

**Security:** Password confirmation is required

---

### 13. **Logout**
| Property | Value |
|----------|-------|
| **Endpoint** | `POST /logout` |
| **Authentication** | ✅ **Required** (Bearer Token) |

**Request Header:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**What happens:**
- Refresh token is cleared from database
- Access token is added to blacklist
- User cannot use old tokens after logout

---

## 🔐 Authentication Flow

### Complete Login & Usage Flow

```
1. USER REGISTERS
   POST /register
   ↓
   Email verification email sent
   ↓
   User clicks verification link
   ↓
   GET /verify-email/:token

2. USER LOGS IN
   POST /login
   ↓
   Receives: accessToken (15 min) + refreshToken (7 days)

3. USER MAKES API REQUESTS
   GET /me
   Header: Authorization: Bearer accessToken
   ↓
   Server validates token & returns user data

4. ACCESS TOKEN EXPIRES (after 15 min)
   POST /refresh-token
   Body: { refreshToken }
   ↓
   Receives new accessToken
   ↓
   Continue using new accessToken

5. USER LOGS OUT
   POST /logout
   Header: Authorization: Bearer accessToken
   ↓
   Refresh token cleared
   ↓
   Access token blacklisted
   ↓
   User cannot use old tokens
```

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # All auth logic
├── middleware/
│   └── authMiddleware.js     # JWT verification
├── models/
│   └── User.js               # User schema
├── routes/
│   └── authroutes.js         # All endpoints
├── .env                      # Environment variables
├── server.js                 # Main server file
├── package.json              # Dependencies
├── Dockerfile                # Docker setup
└── README.md                 # This file
```

---

## 🔑 Key Technologies

| Technology | Purpose |
|-----------|---------|
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **nodemailer** | Email sending |
| **express-rate-limit** | API rate limiting |

---

## 📊 Password Requirements

Passwords must contain:
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (@$!%*?&)

**Example:** `Password@123` ✅

---

## ⏱️ Token Expiration

| Token Type | Expiration | Use Case |
|-----------|-----------|----------|
| **Access Token** | 15 minutes | API requests |
| **Refresh Token** | 7 days | Get new access token |
| **Verification Token** | No expiration | Email verification |
| **Reset Token** | 1 hour | Password reset |

---

## 🛡️ Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **Input Validation**: Email format & password strength
3. **Rate Limiting**: Protects against brute force attacks
4. **Token Blacklist**: Prevents token reuse after logout
5. **Secure Headers**: Authorization bearer token scheme
6. **Email Verification**: Required before login
7. **Password Confirmation**: Required for account deletion

---

## 🐛 Error Handling

All errors return appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| **200** | Success |
| **201** | Created (signup success) |
| **400** | Bad request (validation error) |
| **401** | Unauthorized (auth failed) |
| **404** | Not found (user not found) |
| **500** | Server error |

**Error Response Format:**
```json
{
  "message": "Error description",
  "error": "error details"
}
```

---

## 🎯 Best Practices for Frontend

### 1. Store Tokens Securely
```javascript
// Good: localStorage (simple)
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

// Better: httpOnly cookie (secure)
// Server sets cookie automatically
```

### 2. Send Token in Requests
```javascript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### 3. Handle Token Expiration
```javascript
// When you get 401 response:
1. Call POST /refresh-token
2. Get new accessToken
3. Retry original request
4. If refresh fails, redirect to login
```

### 4. Logout Properly
```javascript
// 1. Call logout endpoint
POST /logout with accessToken

// 2. Clear tokens from storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// 3. Redirect to login
```

---

## 📞 Support & Troubleshooting

### Email Not Sending?
- Check EMAIL_USER and EMAIL_PASS in `.env`
- Verify app password is set in Gmail
- Check inbox spam folder

### MongoDB Connection Error?
- Verify MONGODB_URI is correct
- Check MongoDB is running
- Check network connection

### Rate Limit Hit?
- Wait for the time window to reset
- Adjust limits in `authroutes.js` if needed

### Token Validation Failed?
- Ensure token format is correct: `Bearer <token>`
- Check token hasn't expired
- Verify JWT_SECRET matches in .env

---

## 📄 License

MIT License - Feel free to use this code

---

## ✅ Checklist for Deployment

- [ ] Set all environment variables in `.env`
- [ ] Test all endpoints in Postman
- [ ] Setup MongoDB (Atlas or local)
- [ ] Setup Gmail app password
- [ ] Run `npm install` successfully
- [ ] No console errors on startup
- [ ] Email verification works
- [ ] Token refresh works
- [ ] Rate limiting works
- [ ] Protected routes require token

---

**Created:** February 15, 2026  
**Backend Framework:** Express.js + MongoDB  
**Version:** 1.0.0
