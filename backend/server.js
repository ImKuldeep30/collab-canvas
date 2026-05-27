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
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e7 // 10MB max packet size
});

const PORT = 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = new Map();
const sessionDrawingData = new Map(); // Store drawing data for each session
const sessionChats = new Map(); // Store chat messages for each session
const sessionFiles = new Map(); // Store image file blobs for each session
const sessionTimeouts = new Map(); // Store active termination timeouts

app.set("socketio", io);
app.set("sessions", sessions);
app.set("sessionDrawingData", sessionDrawingData);
app.set("sessionChats", sessionChats);
app.set("sessionTimeouts", sessionTimeouts);

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);

// --- WebSocket Logic Starts Here ---

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
    const adminSocketId = session?.admin || null;
    const adminUserId = session?.userId || null;
    console.log("Inviting team members:", members, "to session:", sessionId, "Team:", teamId);
    if(Array.isArray(members)) {
      members.forEach((memberId) => {
        io.to("user_room_" + memberId).emit("team-session-started", { 
          sessionId, 
          teamName, 
          adminName, 
          teamId,
          adminSocketId,
          adminUserId
        });
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
    sessionDrawingData.set(sessionId, new Map());
    sessionChats.set(sessionId, []);
    sessionFiles.set(sessionId, new Map()); // fileId -> file blob
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
        // Find active session for this team and seed the in-memory drawing data map
        let activeSessionId = null;
        for (const [sid, session] of sessions.entries()) {
          if (session.teamId === teamId) {
            activeSessionId = sid;
            break;
          }
        }
        if (activeSessionId) {
          const drawingMap = sessionDrawingData.get(activeSessionId);
          if (drawingMap && drawingMap.size === 0 && sessionData.drawingData) {
            sessionData.drawingData.forEach(el => {
              drawingMap.set(el.id, el);
            });
            console.log(`Populated session ${activeSessionId} drawing map with ${sessionData.drawingData.length} elements from database.`);
          }
          // Also load chats into memory if empty
          const activeChats = sessionChats.get(activeSessionId);
          if (activeChats && activeChats.length === 0 && sessionData.chatHistory) {
             sessionChats.set(activeSessionId, [...sessionData.chatHistory]);
          }
        }

        if (callback) callback({ 
          success: true, 
          drawingData: sessionData.drawingData || [],
          chatHistory: sessionData.chatHistory || [],
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

  socket.on("check-active-team-session", (teamId, callback) => {
    let activeSession = null;
    for (const [sessionId, session] of sessions.entries()) {
      if (session.teamId === teamId) {
        activeSession = {
          sessionId,
          adminSocketId: session.admin,
          adminUserId: session.userId,
          teamName: session.teamName
        };
        break;
      }
    }
    if (callback) callback({ hasActiveSession: !!activeSession, session: activeSession });
  });

  socket.on("rejoin-session", (data, callback) => {
    const { sessionId, userId, username } = data || {};
    const session = sessions.get(sessionId);
    
    if (!session) {
      if (callback) callback({ success: false, message: "Session not found." });
      return;
    }
    
    // Check if this user is the creator (admin) of the session
    const isSessionAdmin = session.userId === userId;
    
    if (isSessionAdmin) {
      // Clear termination timeout if active
      if (sessionTimeouts.has(sessionId)) {
        clearTimeout(sessionTimeouts.get(sessionId));
        sessionTimeouts.delete(sessionId);
        console.log(`Admin rejoined session ${sessionId}. Termination cancelled.`);
      }
      
      // Clean up old admin socket ID from user list to prevent duplicate admin listings
      if (session.admin && session.admin !== socket.id) {
        session.users.delete(session.admin);
      }
      
      // Update admin socket ID
      session.admin = socket.id;
      session.users.set(socket.id, { username: username || "Admin", canDraw: true });
      socket.join(sessionId);
      
      io.to(sessionId).emit("admin-rejoined", { message: "The admin has rejoined the session." });
      io.to(sessionId).emit("user-joined", { socketId: socket.id, username: username || "Admin", canDraw: true });
      io.to(session.admin).emit("session-users-update", Array.from(session.users.entries()));
      
      const drawingMap = sessionDrawingData.get(sessionId);
      const activeDrawingData = drawingMap ? Array.from(drawingMap.values()) : [];
      const activeChats = sessionChats.get(sessionId) || [];
      if (callback) callback({ 
        success: true, 
        isAdmin: true, 
        canDraw: true, 
        chatEnabled: session.chatEnabled,
        drawingData: activeDrawingData,
        chatHistory: activeChats
      });
    } else {
      if (callback) callback({ success: false, message: "You are not the admin of this session." });
    }
  });

  socket.on("leave-session", (data) => {
    const { sessionId } = data || {};
    const session = sessions.get(sessionId);
    if (session) {
      session.users.delete(socket.id);
      socket.leave(sessionId);
      io.to(sessionId).emit("user-left", socket.id);
      if (sessions.has(sessionId)) {
        const currentSession = sessions.get(sessionId);
        io.to(currentSession.admin).emit("session-users-update", Array.from(currentSession.users.entries()));
      }
    }
  });

  socket.on("save-drawing-data", (data) => {
    const { sessionId, drawingData } = data || {};
    if (sessionId && Array.isArray(drawingData)) {
      const drawingMap = new Map();
      drawingData.forEach(el => drawingMap.set(el.id, el));
      sessionDrawingData.set(sessionId, drawingMap);
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
      
      const drawingMap = sessionDrawingData.get(sessionId);
      const activeDrawingData = drawingMap ? Array.from(drawingMap.values()) : [];
      const activeChats = sessionChats.get(sessionId) || [];
      const activeFiles = sessionFiles.get(sessionId) ? Object.fromEntries(sessionFiles.get(sessionId)) : {};
      
      const adminUser = session.users.get(session.admin);
      const adminName = adminUser ? adminUser.username : "Admin";
      
      io.to(socketId).emit("join-accepted", { 
        sessionId, 
        drawingData: activeDrawingData,
        chatHistory: activeChats,
        files: activeFiles,
        teamId: session.teamId || null,
        teamName: session.teamName || null,
        adminName
      });
      
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
    console.log(`[TERMINATE] terminate-session called for ${sessionId} by ${socket.id}`);
    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`[TERMINATE] ERROR: No session found for ${sessionId}`);
      return;
    }
    if (session.admin !== socket.id) {
      console.log(`[TERMINATE] ERROR: Socket ${socket.id} is not admin. Admin is ${session.admin}`);
      return;
    }
    // If this is a team session, save to database
    if (session.teamId) {
      const drawingMap = sessionDrawingData.get(sessionId);
      const drawingData = drawingMap ? Array.from(drawingMap.values()) : [];
      const chats = sessionChats.get(sessionId) || [];
      const canvasWidth = data?.canvasWidth || 1920;
      const canvasHeight = data?.canvasHeight || 1080;
      
      console.log(`[TERMINATE] Saving team session. teamId=${session.teamId}, chats=${chats.length}, drawings=${drawingData.length}`);
      
      const updatePayload = {
        $set: {
          teamName: session.teamName,
          drawingData: drawingData,
          chatHistory: chats,
          canvasWidth: canvasWidth,
          canvasHeight: canvasHeight,
          lastModified: new Date(),
        }
      };
      
      // Only set createdBy if we have a userId
      if (session.userId) {
        updatePayload.$set.createdBy = session.userId;
      }
      
      SessionData.findOneAndUpdate(
        { teamId: session.teamId },
        updatePayload,
        { upsert: true, returnDocument: 'after' }
      ).then(result => {
        console.log(`[TERMINATE] DB save SUCCESS. chatHistory saved: ${result?.chatHistory?.length || 0} msgs, drawings: ${result?.drawingData?.length || 0}`);
      }).catch(err => {
        console.error("[TERMINATE] DB save ERROR:", err.message);
      });
      
      console.log(`[TERMINATE] Team session ${sessionId} (Team: ${session.teamName}) data queued for DB save`);
    } else {
      console.log(`[TERMINATE] Local session ${sessionId} — no data saved.`);
    }
    
    io.to(sessionId).emit("session-terminated", { sessionId, message: "The admin has terminated the session." });
    io.in(sessionId).socketsLeave(sessionId);
    sessionDrawingData.delete(sessionId);
    sessionChats.delete(sessionId);
    sessionFiles.delete(sessionId);
    sessions.delete(sessionId);
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
    
    const drawingMap = sessionDrawingData.get(sessionId);
    const activeDrawingData = drawingMap ? Array.from(drawingMap.values()) : [];
    const activeChats = sessionChats.get(sessionId) || [];
    const activeFiles = sessionFiles.get(sessionId) ? Object.fromEntries(sessionFiles.get(sessionId)) : {};
    
    if (callback) callback({ 
      success: true, 
      canDraw: true,
      drawingData: activeDrawingData,
      chatHistory: activeChats,
      files: activeFiles
    });
  });

  socket.on("draw", (data) => {
    const session = sessions.get(data.sessionId);
    if (session && session.users.has(socket.id)) {
      if (session.users.get(socket.id).canDraw) {
        // Store drawing data if it's a team session
        if (session.teamId && sessionDrawingData.has(data.sessionId)) {
          const currentDrawingMap = sessionDrawingData.get(data.sessionId);
          
          // Store Excalidraw elements directly
          if (currentDrawingMap && Array.isArray(data.elements)) {
            data.elements.forEach(el => {
              currentDrawingMap.set(el.id, el);
            });
          }
        }
        
        socket.to(data.sessionId).emit("draw", data);
      }
    }
  });

  socket.on("cursor-move", (data) => {
    if (data.sessionId) {
      socket.to(data.sessionId).volatile.emit("cursor-move", { ...data, userId: socket.id });
    }
  });

  // Sync image file blobs so images are visible to all session members
  socket.on("sync-files", (data) => {
    const { sessionId, files } = data; // files: { [fileId]: { dataURL, mimeType, ... } }
    const session = sessions.get(sessionId);
    if (session && session.users.has(socket.id) && files) {
      // Store in memory so late-joiners also get them
      let fileMap = sessionFiles.get(sessionId);
      if (!fileMap) {
        fileMap = new Map();
        sessionFiles.set(sessionId, fileMap);
      }
      Object.entries(files).forEach(([fileId, fileData]) => {
        if (!fileMap.has(fileId)) {
          fileMap.set(fileId, fileData); // blobs are immutable — only store once
        }
      });
      // Broadcast raw files object to all OTHER members
      socket.to(sessionId).emit("sync-files", { files });
    }
  });

  socket.on("clear", (sessionId) => {
    const session = sessions.get(sessionId);
    if (session && session.users.has(socket.id)) {
      if (session.users.get(socket.id).canDraw) {
        // Clear drawing data if it's a team session
        if (session.teamId && sessionDrawingData.has(sessionId)) {
          sessionDrawingData.set(sessionId, new Map());
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
      if (session.teamId && sessionChats.has(sessionId)) {
        sessionChats.set(sessionId, []); // Clear in memory
      }
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
      const chatMsg = {
        socketId: socket.id,
        username: senderName,
        message: message,
        timestamp: new Date().toISOString()
      };
      
      // Save to memory if it's a team session
      if (session.teamId) {
        if (sessionChats.has(sessionId)) {
          sessionChats.get(sessionId).push(chatMsg);
          console.log(`[CHAT] Stored msg in memory for session ${sessionId} (team: ${session.teamId}). Total: ${sessionChats.get(sessionId).length}`);
        } else {
          // sessionChats map entry missing — recreate it
          sessionChats.set(sessionId, [chatMsg]);
          console.log(`[CHAT] Created missing chat map for session ${sessionId}. Stored 1 msg.`);
        }
      } else {
        console.log(`[CHAT] Local session ${sessionId} — chat NOT stored (ephemeral).`);
      }
      
      io.to(sessionId).emit("receive-chat", chatMsg);
    } else {
      console.log(`[CHAT] send-chat FAILED: session=${sessionId}, socketInSession=${session ? session.users.has(socket.id) : 'no session'}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    sessions.forEach((session, sessionId) => {
      if (session.users.has(socket.id)) {
        if (session.admin === socket.id) {
          console.log(`Admin disconnected from session ${sessionId}. Starting 5-minute grace period...`);
          
          io.to(sessionId).emit("admin-disconnected", { 
            message: "The admin has left the session. The system is waiting for the admin to return..." 
          });
          
          const timeoutId = setTimeout(() => {
            if (session.teamId) {
              const drawingMap = sessionDrawingData.get(sessionId);
              const drawingData = drawingMap ? Array.from(drawingMap.values()) : [];
              const chats = sessionChats.get(sessionId) || [];
              
              SessionData.findOneAndUpdate(
                { teamId: session.teamId },
                {
                  teamId: session.teamId,
                  teamName: session.teamName,
                  drawingData: drawingData,
                  chatHistory: chats,
                  canvasWidth: 1920,
                  canvasHeight: 1080,
                  lastModified: new Date(),
                  createdBy: session.userId,
                },
                { upsert: true, new: true }
              ).catch(err => {
                console.error("Error saving session data on disconnect:", err);
              });
            }
            
            io.to(sessionId).emit("session-terminated", { sessionId, message: "The admin left and did not return within 5 minutes. Session terminated." });
            io.in(sessionId).socketsLeave(sessionId);
            sessionDrawingData.delete(sessionId);
            sessionChats.delete(sessionId);
            sessions.delete(sessionId);
            sessionTimeouts.delete(sessionId);
          }, 300000); // 5 minutes grace period
          
          sessionTimeouts.set(sessionId, timeoutId);
        } else {
          session.users.delete(socket.id);
          io.to(sessionId).emit("user-left", socket.id);
          if (sessions.has(sessionId)) {
            const currentSession = sessions.get(sessionId);
            io.to(currentSession.admin).emit("session-users-update", Array.from(currentSession.users.entries()));
          }
        }
      }
    });
  });
});

// --- WebSocket Logic Ends Here ---

server.listen(PORT, "0.0.0.0",()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});

