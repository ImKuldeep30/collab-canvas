const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST"]
  }
});

// A basic map to keep track of sessions
// sessions[sessionId] = { 
//   admin: socketId,
//   users: Map(socketId => { username, canDraw }),
//   password: password_string (optional),
//   chatEnabled: boolean
// }
const sessions = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-session", (data, callback) => {
    const password = data?.password || null;
    const username = data?.username || "Admin";
    const sessionId = uuidv4().substring(0, 8); 
    socket.join(sessionId);
    
    const usersMap = new Map();
    usersMap.set(socket.id, { username, canDraw: true });
    
    sessions.set(sessionId, { 
      admin: socket.id,
      users: usersMap, 
      password,
      chatEnabled: true
    });
    console.log(`Session ${sessionId} created by ${socket.id} (Admin)`);
    if (callback) callback({ sessionId });
  });

  // User requests to join (password check here)
  socket.on("join-request", (data, callback) => {
    const { sessionId, password, username } = data || {};
    
    if (!sessions.has(sessionId)) {
      if (callback) callback({ success: false, message: "Session not found." });
      return;
    }
    
    const session = sessions.get(sessionId);
    
    if (session.password && session.password !== password) {
      if (callback) callback({ success: false, message: "Incorrect password." });
      return;
    }

    if (session.users.has(socket.id)) {
      if (callback) callback({ success: false, message: "Already in session." });
      return;
    }

    // Forward request to admin
    io.to(session.admin).emit("join-request-received", {
      socketId: socket.id,
      username: username || "Anonymous"
    });
    
    // Tell the joining user we are waiting for admin
    if (callback) callback({ success: true, pending: true, message: "Waiting for admin approval..." });
  });

  // Admin accepts the join request
  socket.on("accept-join", (data) => {
    const { sessionId, socketId, username } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      // Add user to session
      session.users.set(socketId, { username, canDraw: true }); // Default allowed to draw
      
      // Notify the accepted user
      io.to(socketId).emit("join-accepted", { sessionId });
      
      // Make that user join the room socket
      const joiningSocket = io.sockets.sockets.get(socketId);
      if (joiningSocket) {
        joiningSocket.join(sessionId);
      }
      
      // Notify others in the session that someone joined
      io.to(sessionId).emit("user-joined", { socketId, username, canDraw: true });
      
      // Send the current user list to the admin
      io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
    }
  });

  // Admin rejects the join request
  socket.on("reject-join", (data) => {
    const { sessionId, socketId } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
        io.to(socketId).emit("join-rejected", { message: "Admin rejected your join request." });
    }
  });

  // When a user successfully confirms their entry after being accepted (client-side join completion)
  // Actually, we already added them to the room in accept-join. We just need to give them the existing state.
  socket.on("get-session-users", (sessionId, callback) => {
    const session = sessions.get(sessionId);
    if (session && session.users.has(socket.id)) {
       const isAdmin = session.admin === socket.id;
       const myPermission = session.users.get(socket.id).canDraw;
       if (callback) callback({ users: Array.from(session.users.entries()), isAdmin, canDraw: myPermission, chatEnabled: session.chatEnabled });
    } else {
       if (callback) callback({ users: [], isAdmin: false, canDraw: false, chatEnabled: true });
    }
  });

  // Admin toggles drawing permission
  socket.on("toggle-draw-permission", (data) => {
    const { sessionId, targetSocketId, canDraw } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      if (session.users.has(targetSocketId)) {
        session.users.get(targetSocketId).canDraw = canDraw;
        io.to(sessionId).emit("permission-updated", { socketId: targetSocketId, canDraw });
        io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
      }
    }
  });

  // Admin kicks user
  socket.on("kick-user", (data) => {
    const { sessionId, targetSocketId } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      if (session.users.has(targetSocketId)) {
        session.users.delete(targetSocketId);
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.leave(sessionId);
          targetSocket.emit("kicked", { message: "You have been kicked from the session by the admin." });
        }
        io.to(sessionId).emit("user-left", targetSocketId);
        io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
      }
    }
  });

  // Admin terminates session
  socket.on("terminate-session", (sessionId) => {
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      io.to(sessionId).emit("session-terminated", { message: "The admin has terminated the session." });
      // Remove all users from the room
      io.in(sessionId).socketsLeave(sessionId);
      sessions.delete(sessionId);
    }
  });

  // OLD join-session for fallbacks or we just let it be modified (removed safely).
  socket.on("join-session", (data, callback) => {
      // Disabled since we use join-request now.
      if (callback) callback({ success: false, message: "Please use the updated join flow." });
  });

  socket.on("draw", (data) => {
    const session = sessions.get(data.sessionId);
    if (session && session.users.has(socket.id)) {
      if (session.users.get(socket.id).canDraw) {
        socket.to(data.sessionId).emit("draw", data);
      }
    }
  });

  socket.on("cursor-move", (data) => {
    // Only need basic validation for cursor
    if (data.sessionId) {
      socket.to(data.sessionId).emit("cursor-move", { ...data, userId: socket.id });
    }
  });

  socket.on("clear", (sessionId) => {
    const session = sessions.get(sessionId);
    if (session && session.users.has(socket.id)) {
      if (session.users.get(socket.id).canDraw) {
        socket.to(sessionId).emit("clear");
      }
    }
  });

  // Admin toggles chat
  socket.on("toggle-chat", (data) => {
    const { sessionId, e: enabled } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      session.chatEnabled = enabled;
      io.to(sessionId).emit("chat-status-updated", { enabled });
    }
  });

  // Admin clears chats
  socket.on("clear-chats", (data) => {
    const sessionId = typeof data === 'string' ? data : data.sessionId;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      io.to(sessionId).emit("chats-cleared");
    }
  });

  // Chat capability
  socket.on("send-chat", (data) => {
    const { sessionId, message } = data;
    const session = sessions.get(sessionId);
    if (session && session.users.has(socket.id)) {
      // Check if chat is enabled or if user is admin
      if (!session.chatEnabled && session.admin !== socket.id) {
        return; // Reject chat if disabled and not admin
      }
      
      const senderName = session.users.get(socket.id).username;
      io.to(sessionId).emit("receive-chat", {
        socketId: socket.id,
        username: senderName,
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    sessions.forEach((session, sessionId) => {
      if (session.users.has(socket.id)) {
        if (session.admin === socket.id) {
          // Admin left? Maybe terminate session automatically.
          io.to(sessionId).emit("session-terminated", { message: "The admin left, session terminated." });
          io.in(sessionId).socketsLeave(sessionId);
          sessions.delete(sessionId);
        } else {
          session.users.delete(socket.id);
          socket.to(sessionId).emit("user-left", socket.id);
          if (io.sockets.sockets.has(session.admin)) {
            io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
          }
        }
      }
    });
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
 