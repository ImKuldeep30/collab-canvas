# CoCanvas Frontend 🎨

Welcome to the technical engineering reference for the **CoCanvas** frontend—a premium, responsive, glassmorphic collaborative design platform. This document outlines the inner architectural workings, component synchronization lifecycles, real-time socket events, state caching strategies, and styling conventions.

---

## 🏗️ Core Architecture & Component Tree

The frontend is structured as a **Single Page Application (SPA)** utilizing `react-router-dom` for route management.

```
                  ┌──────────────────────┐
                  │      index.html      │ (Entry Point)
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │      main.jsx        │ (Vite Bootstrapping)
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │       App.jsx        │ (Route Dispatcher)
                  └────┬───────────┬─────┘
                       │           │
     ┌─────────────────▼─┐       ┌─▼───────────────────┐
     │    Public Routes  │       │   Protected Routes  │
     │  (/, /login,      │       │     (/home)         │
     │   /register,      │       └──────────┬──────────┘
     │   /forget)        │                  │
     └───────────────────┘       ┌──────────▼───────────┐
                                 │      Home.jsx        │ (Orchestrator Page)
                                 └────┬──────┬──────┬───┘
                                      │      │      │
       ┌──────────────────────────────┘      │      └──────────────────────────────┐
       │                                     │                                     │
┌──────▼───────────┐                ┌────────▼──────────┐                ┌─────────▼─────────┐
│  CanvasBoard.jsx │                │   ChatPanel.jsx   │                │ParticipantsPanel.│
│ (Excalidraw UI)  │                │ (Session Message) │                │    (Live Users)   │
└──────────────────┘                └───────────────────┘                └───────────────────┘
```

---

## 🔌 Real-time WebSocket Integration Layer

Real-time collaboration is managed in **`Home.jsx`** through `socket.io-client`. When a user logs in and joins or hosts a session:

### 1. Connection Lifecycle
* **Establishment**: Sockets are initialized dynamically on page load:
  ```javascript
  const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000");
  ```
* **Authentication**: Once connected, the socket registers the authenticated user's ID:
  ```javascript
  newSocket.emit("register-user", userId);
  ```
* **Tear-Down**: Upon component unmount (or logging out), the socket connection is explicitly disconnected to avoid active memory leaks in the browser:
  ```javascript
  return () => newSocket.disconnect();
  ```

### 2. Handled Socket Listeners
Inside `Home.jsx`, the following active channels synchronize UI states instantly:
* `team-session-started`: Triggers an elegant glassmorphic alert asking user to join their team's newly active canvas board.
* `join-accepted`: Receives active `drawingData` and `chatHistory` payload from the database and loads them into Excalidraw and the chat box.
* `session-users-update`: Syncs the active participant avatars, names, and drawing permissions.
* `user-joined` / `user-left`: Triggers small micro-animated status notifications.
* `session-terminated`: Safely locks the canvas view and redirects participants back to the team board.

---

## 🎨 Excalidraw SDK & Drawing Engine

**`CanvasBoard.jsx`** encapsulates the **Excalidraw React SDK** to render vector-based sketches, shapes, and notes.

### 1. Drawing Sync Mechanism
To prevent network congestions while maintaining high-fidelity realtime updates, drawing events are debounced and emitted through the socket:
1. User interacts with the canvas, drawing a vector shape or line.
2. The `onChange` handler captures the updated canvas elements.
3. The component filters out unchanged shapes and emits only mutated vector layers over the `draw` channel:
   ```javascript
   socket.emit("draw", { sessionId, elements: updatedElements });
   ```
4. Other session participants receive the elements and update their local canvas state using Excalidraw's `updateScene` function.

### 2. Viewport Scale & Admin Controls
* **Admin Controls**: The session administrator can toggle user drawing permissions. When drawing permissions are toggled off, `CanvasBoard` sets Excalidraw's `viewModeEnabled` prop to `true`, rendering the whiteboard in strict "read-only" lock.

---

## 💾 State Management & Local Caching

Instead of heavy Redux boilerplate, CoCanvas relies on React's native context and state management combined with a high-performance **Local Caching layer**:

* **Token Storage**: JWT `accessToken` and `refreshToken` are stored in secure browser `localStorage` on successful verification.
* **Axios Interceptors**: Axios is configured to automatically inject the Bearer token into HTTP headers for secure endpoints:
  ```javascript
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  ```
* **Auto-Login**: When a user re-visits the page, `Home.jsx` checks the cache. If a token is found, it sends an authorization handshake to `/api/auth/me` to restore the active user session seamlessly without a full reload.

---

## 💎 Premium Design Aesthetics

The project implements a bespoke **Deep Dark Theme** to ensure a state-of-the-art interactive workspace.

* **Palette System**: Curated dark background colors (`#0a0a0c` base background with `#121214` glassmorphic containers) styled with smooth indigo-to-purple (`#6366f1` to `#a855f7`) gradients.
* **Glassmorphism**: Visual containers leverage `backdrop-blur-xl`, `bg-white/5` semi-transparent backgrounds, and thin `border-white/10` borders for a modern frosted-glass effect.
* **Micro-animations**: Form submit buttons, navigation tabs, and profile icons use smooth transitions (`transition-all duration-300`) and scale triggers (`hover:scale-[1.01] active:scale-[0.99]`) to maximize click feedback.
