require("dotenv").config();
const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authroutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend's URL
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);

// --- WebSocket Logic Starts Here ---

const sessions = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register-user", (userId) => {
    socket.join("user_room_" + userId);
    console.log("User " + userId + " registered to room");
  });

  socket.on("invite-team-to-session", (data) => {
    const { sessionId, teamName, adminName, members } = data;
    console.log("Inviting team members:", members, "to session:", sessionId);
    if(Array.isArray(members)) {
      members.forEach((memberId) => {
        io.to("user_room_" + memberId).emit("team-session-started", { sessionId, teamName, adminName });
      });
    }
  });

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

    io.to(session.admin).emit("join-request-received", {
      socketId: socket.id,
      username: username || "Anonymous"
    });
    
    if (callback) callback({ success: true, pending: true, message: "Waiting for admin approval..." });
  });

  socket.on("accept-join", (data) => {
    const { sessionId, socketId, username } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      session.users.set(socketId, { username, canDraw: true });
      
      io.to(socketId).emit("join-accepted", { sessionId });
      
      const joiningSocket = io.sockets.sockets.get(socketId);
      if (joiningSocket) {
        joiningSocket.join(sessionId);
      }
      
      io.to(sessionId).emit("user-joined", { socketId, username, canDraw: true });
      
      io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
    }
  });

  socket.on("reject-join", (data) => {
    const { sessionId, socketId } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
        io.to(socketId).emit("join-rejected", { message: "Admin rejected your join request." });
    }
  });

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

  socket.on("terminate-session", (sessionId) => {
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      io.to(sessionId).emit("session-terminated", { message: "The admin has terminated the session." });
      io.in(sessionId).socketsLeave(sessionId);
      sessions.delete(sessionId);
    }
  });

  socket.on("join-team-session", (data, callback) => {
    const { sessionId, username } = data || {};
    const session = sessions.get(sessionId);
    
    if (!session) {
      if (callback) callback({ success: false, message: "Session not found." });
      return;
    }
    
    session.users.set(socket.id, { username: username || "Team Member", canDraw: true });
    socket.join(sessionId);
    
    io.to(sessionId).emit("user-joined", { socketId: socket.id, username: username || "Team Member", canDraw: true });
    io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
    
    if (callback) callback({ success: true, canDraw: true });
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

  socket.on("toggle-chat", (data) => {
    const { sessionId, e: enabled } = data;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      session.chatEnabled = enabled;
      io.to(sessionId).emit("chat-status-updated", { enabled });
    }
  });

  socket.on("clear-chats", (data) => {
    const sessionId = typeof data === 'string' ? data : data.sessionId;
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      io.to(sessionId).emit("chats-cleared");
    }
  });

  socket.on("send-chat", (data) => {
    const { sessionId, message } = data;
    const session = sessions.get(sessionId);
    if (session && session.users.has(socket.id)) {
      if (!session.chatEnabled && session.admin !== socket.id) {
        return;
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
          io.to(sessionId).emit("session-terminated", { message: "The admin left, session terminated." });
          io.in(sessionId).socketsLeave(sessionId);
          sessions.delete(sessionId);
        } else {
          session.users.delete(socket.id);
          io.to(sessionId).emit("user-left", socket.id);
          io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
        }
      }
    });
  });
});

// --- WebSocket Logic Ends Here ---

server.listen(PORT, "0.0.0.0",()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});

