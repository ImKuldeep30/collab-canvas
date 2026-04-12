# Canvas Collaboration App - Frontend Overview

Welcome to the frontend of the Canvas Collaboration App! This guide is designed to help anyone—whether you're a developer joining the project or someone just curious—understand how the frontend is built, structured, and how it talks to our backend server.

---

## 🏗️ Technology Stack

- **React.js**: The core library used for building the user interface.
- **Vite**: A fast build tool that bundles our code and serves it during development.
- **Tailwind CSS**: A utility-first CSS framework for quickly styling components right in the code.
- **Socket.io-client**: The library used to establish a persistent, real-time connection with our backend for live drawing and chatting.

---

## 📁 Folder Structure Explained

Here's an easy-to-understand breakdown of what's inside the `src/` directory:

### `src/components/`
This folder holds the reusable "building blocks" (components) of the app. By splitting the app into components, the code becomes much easier to read and maintain.
- **`CanvasBoard.jsx`**: The core drawing area. It captures your mouse movements and sends them to the server.
- **`Navbar.jsx`**: The top navigation bar containing the buttons for teams, joining sessions, chatting, and settings.
- **`ChatPanel.jsx` & `ParticipantsPanel.jsx`**: The sliding panels on the right side for messaging inside a session and managing who is in the room.
- **Modals (e.g., `JoinSessionModal.jsx`, `CreateSessionModal.jsx`, `MyTeamsModal.jsx`, `UpdateProfileModal.jsx`)**: Pop-up boxes that handle smaller tasks like creating a team, checking active requests, or starting sessions.

### `src/pages/`
These are the main "views" or "screens" of the application.
- **`Home.jsx`**: The main workspace where the canvas, chat, and participants panels all live together. It's the control center for active sessions.
- **Authentication Pages (`Login.jsx`, `Register.jsx`, `Forget.jsx`)**: The screens users see when they are signing up, logging in, or resetting passwords.

### `src/App.jsx`
The "traffic controller" of the apps. It decides which page (`Home`, `Login`, etc.) to show based on the user's current URL and whether they are logged in or not.

---

## 🔌 How the Frontend Connects to the Backend

The frontend communicates with the unified backend (running on port `3000`) in two completely different ways: **REST APIs** (for simple, one-time requests) and **WebSockets** (for continuous, real-time data).

### 1. The HTTP REST API (Traditional Requests)
**Used for:** Logging in, registering, creating teams, and fetching data.
**How it works:** Just like ordering food online, the frontend sends a single request to the backend and waits for a response.
- **Example Flow**: When a user fills out the `Login.jsx` form and clicks "Submit", the frontend fires off a `POST` request to `http://localhost:3000/api/auth/login`. 
- **Security**: Upon successful login, the backend responds with a secure "Token" and the user's details. The frontend saves this locally in your browser's `localStorage`. This token proves you are logged in for future actions.

### 2. WebSockets (Real-Time Communication via Socket.io)
**Used for:** Live drawing on the canvas, instant chat messages, live cursor movements, and instant notifications (like when an admin starts a team session).
**How it works:** Instead of a one-time request, a WebSocket creates an open "phone line" between the frontend and the backend. Both sides can send data back and forth instantly without having to ask first.

#### The Lifecycle of the WebSocket Connection:
1. **Connecting**: inside `Home.jsx`, as soon as the page loads (and the user is logged in), the frontend dials the backend using: `const newSocket = io("http://localhost:3000");`
2. **Registering**: Once connected, the frontend says, *"Hey, I am user X!"* (`socket.emit("register-user", ...)`). The server creates a private room perfectly tailored for that specific user.
3. **Collaborating (Drawing/Chatting)**: 
   - When you draw a line in `CanvasBoard.jsx`, it emits a `"draw"` event with coordinates to the backend. The backend immediately shouts out those coordinates to everyone else in your active session.
   - When you send a message in `ChatPanel.jsx`, it emits a `"send-chat"` event, and the backend routes it to the other session participants.
4. **Team Invites (The "Live Notification" Flow)**: 
   - An admin clicks "Start Session" in `MyTeamsModal.jsx`. 
   - The frontend emits `"invite-team-to-session"` along with the active `members` list.
   - The backend catches this, looks up those specific members, and pushes a `"team-session-started"` event securely down their open WebSocket connections.
   - The member's `Home.jsx` receives the event and instantly renders the "Join / Ignore" pop-up.

---

## 🔧 Deep Dive into Frontend Features

### 🎨 Responsive & Themed UI
Our frontend uses **Tailwind CSS** to build a fully custom, responsive, and dark-themed UI.
- All styles are utility-based, making it easy to create consistent padding, margins, flex layouts, and typography.
- We use the `lucide-react` library for consistent, lightweight SVG icons across buttons and Modals.

### 📡 State Management & Hooks
We rely purely on React's built-in hooks to manage state, doing away with the need for complex global state managers like Redux:
- **`useState`**: Used everywhere to handle component-level state like checking if a modal is open, form inputs, or keeping track of the current `sessionId`.
- **`useEffect`**: Crucial for firing off initial side effects. Most importantly, it's used in `Home.jsx` to establish the WebSocket connection when the user first opens the app and cleans it up when they disconnect or close the tab.
- **Local Storage**: We utilize the browser's native `localStorage` mechanism to store the JWT string and User Profile JSON upon successful login, which persists their session.

### 🛡️ Protected Routing
In `App.jsx` (and commonly through `ProtectedRoute.jsx`), we wrap all routes that should be inaccessible to unverified guests.
- **If they aren't logged in:** Any attempt to reach `/home` is instantly redirected to `/login`.
- **If they are logged in:** Loading `/login` will safely reroute them back to `/home`.

---

## 🏃 Commands to Run

To run the frontend locally:
1. Open a terminal in the `frontend/` directory.
2. Run `npm install` (to download the libraries if you haven't yet).
3. Run `npm run dev` (to start the Vite local development server).
4. The terminal will provide a `localhost` URL (usually `http://localhost:5173`) where you can view the app in your browser!
