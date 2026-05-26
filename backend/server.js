require("dotenv").config();
const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authroutes");
const teamRoutes = require("./routes/teamRoutes");
const SessionData = require("./models/SessionData");

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
const sessionDrawingData = new Map(); // Store drawing data for each session

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register-user", (userId) => {
    socket.join("user_room_" + userId);
    console.log("User " + userId + " registered to room");
  });

  socket.on("invite-team-to-session", (data) => {
    const { sessionId, teamName, adminName, members } = data;
    const session = sessions.get(sessionId);
    const teamId = session?.teamId || null;
    console.log("Inviting team members:", members, "to session:", sessionId, "Team:", teamId);
    if(Array.isArray(members)) {
      members.forEach((memberId) => {
        io.to("user_room_" + memberId).emit("team-session-started", { sessionId, teamName, adminName, teamId });
      });
    }
  });

  socket.on("create-session", (data, callback) => {
    const password = data?.password || null;
    const username = data?.username || "Admin";
    const teamId = data?.teamId || null;
    const teamName = data?.teamName || null;
    const userId = data?.userId || null;
    const sessionId = uuidv4().substring(0, 8); 
    socket.join(sessionId);
    
    const usersMap = new Map();
    usersMap.set(socket.id, { username, canDraw: true });
    
    sessions.set(sessionId, { 
      admin: socket.id,
      users: usersMap, 
      password,
      chatEnabled: true,
      teamId,
      teamName,
      userId,
      createdAt: new Date()
    });
    sessionDrawingData.set(sessionId, []);
    console.log(`Session ${sessionId} created by ${socket.id} (Admin) - Team: ${teamName || 'None'}`);
    if (callback) callback({ sessionId });
  });

  socket.on("load-previous-session", (data, callback) => {
    const { teamId } = data || {};
    if (!teamId) {
      if (callback) callback({ success: false, message: "No teamId provided" });
      return;
    }

    SessionData.findOne({ teamId }).sort({ lastModified: -1 }).then(sessionData => {
      if (sessionData) {
        if (callback) callback({ 
          success: true, 
          drawingData: sessionData.drawingData || [],
          canvasWidth: sessionData.canvasWidth,
          canvasHeight: sessionData.canvasHeight,
          message: "Previous session data loaded"
        });
      } else {
        if (callback) callback({ success: true, drawingData: [], message: "No previous session found" });
      }
    }).catch(err => {
      console.error("Error loading previous session:", err);
      if (callback) callback({ success: false, message: "Error loading previous session" });
    });
  });

  socket.on("save-drawing-data", (data) => {
    const { sessionId, drawingData } = data || {};
    if (sessionId && Array.isArray(drawingData)) {
      sessionDrawingData.set(sessionId, drawingData);
      console.log(`Drawing data saved for session ${sessionId} - ${drawingData.length} strokes`);
    }
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

  socket.on("terminate-session", (sessionId, data) => {
    const session = sessions.get(sessionId);
    if (session && session.admin === socket.id) {
      // If this is a team session, save the drawing data to database
      if (session.teamId) {
        const drawingData = sessionDrawingData.get(sessionId) || [];
        const canvasWidth = data?.canvasWidth || 1920;
        const canvasHeight = data?.canvasHeight || 1080;
        
        SessionData.findOneAndUpdate(
          { teamId: session.teamId },
          {
            teamId: session.teamId,
            teamName: session.teamName,
            drawingData: drawingData,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            lastModified: new Date(),
            createdBy: session.userId,
          },
          { upsert: true, new: true }
        ).catch(err => {
          console.error("Error saving session data:", err);
        });
        
        console.log(`Team session ${sessionId} (Team: ${session.teamName}) data saved to database`);
      }
      
      io.to(sessionId).emit("session-terminated", { message: "The admin has terminated the session." });
      io.in(sessionId).socketsLeave(sessionId);
      sessionDrawingData.delete(sessionId);
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
        // Store drawing data if it's a team session
        if (session.teamId && sessionDrawingData.has(data.sessionId)) {
          const currentDrawingData = sessionDrawingData.get(data.sessionId) || [];
          
          // Store Excalidraw elements directly
          if (Array.isArray(data.elements)) {
            // Replace or merge elements based on their IDs
            const elementMap = new Map(currentDrawingData.map(el => [el.id, el]));
            data.elements.forEach(el => {
              elementMap.set(el.id, el);
            });
            sessionDrawingData.set(data.sessionId, Array.from(elementMap.values()));
          }
        }
        
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
        // Clear drawing data if it's a team session
        if (session.teamId && sessionDrawingData.has(sessionId)) {
          sessionDrawingData.set(sessionId, []);
        }
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

