import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import CanvasBoard from "../components/CanvasBoard";
import Navbar from "../components/Navbar";
import ChatPanel from "../components/ChatPanel";
import ParticipantsPanel from "../components/ParticipantsPanel";
import AlertModal from "../components/AlertModal";

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canDraw, setCanDraw] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "", message: "" });
  const [inviteData, setInviteData] = useState(null);
  const [previousSessionData, setPreviousSessionData] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [drawingData, setDrawingData] = useState([]); // Track drawing data for team sessions
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isAdminLeft, setIsAdminLeft] = useState(false);
  const [adminLeftMessage, setAdminLeftMessage] = useState("");
  const [myTeams, setMyTeams] = useState([]);
  const ignoredSessionsRef = useRef(new Set());
  const canvasContainerRef = useRef(null);

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setHasUnreadMessages(false);
    }
  }, [isChatOpen]);

  const showAlert = (title, message) => {
    setAlertConfig({ isOpen: true, title, message });
  };
  useEffect(() => {
    const newSocket = io("http://192.168.1.10:3000"); // Socket connection available only after successful login
    setSocket(newSocket);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id || user._id;
    if (userId) {
      newSocket.emit("register-user", userId);
      newSocket.on("connect", () => {
        newSocket.emit("register-user", userId);
      });
    }

    newSocket.on("team-session-started", (data) => {
      // Don't notify the socket connection that started it
      if (newSocket.id !== data.adminSocketId) {
        setInviteData(data);
      }
    });

    newSocket.on("join-accepted", (data) => {
       setSessionId(data.sessionId);
       if (data.drawingData) {
         setPreviousSessionData({ success: true, drawingData: data.drawingData });
         setDrawingData(data.drawingData);
       }
       if (data.chatHistory) {
         setChatMessages(data.chatHistory);
       }
       if (data.teamId && data.teamName) {
         setTeamInfo({
           sessionId: data.sessionId,
           teamId: data.teamId,
           teamName: data.teamName,
           adminName: data.adminName
         });
       }
    });

    newSocket.on("join-rejected", (data) => {
       showAlert("Join Request Denied", data.message || "The admin rejected your join request.");
    });

    // Global session events
    newSocket.on("kicked", (data) => {
      showAlert("Session Ended", data.message);
      setSessionId(null);
      setIsAdmin(false);
      setChatMessages([]);
      setIsAdminLeft(false);
    });

    newSocket.on("session-terminated", (data) => {
      // Save drawing data if it's a team session before clearing
      if (teamInfo && sessionId && drawingData.length > 0) {
        socket.emit("save-drawing-data", {
          sessionId: sessionId,
          drawingData: drawingData
        });
      }
      showAlert("Session Ended", data.message);
      setSessionId(null);
      setIsAdmin(false);
      setChatMessages([]);
      setTeamInfo(null);
      setDrawingData([]);
      setPreviousSessionData(null);
      setIsAdminLeft(false);
    });

    newSocket.on("permission-updated", (data) => {
      // If this user was updated, update local drawing permission
      if (data.socketId === newSocket.id) {
        setCanDraw(data.canDraw);
      }
    });

    newSocket.on("join-request-received", (requestData) => {
      setJoinRequests((prev) => [...prev, requestData]);
    });

    newSocket.on("receive-chat", (chatData) => {
      setChatMessages((prev) => [...prev, chatData]);
      if (!isChatOpenRef.current) {
        setHasUnreadMessages(true);
      }
    });

    newSocket.on("chat-status-updated", (data) => {
      setIsChatEnabled(data.enabled);
    });

    newSocket.on("chats-cleared", () => {
      setChatMessages([]);
    });

    newSocket.on("admin-disconnected", (data) => {
      setIsAdminLeft(true);
      setAdminLeftMessage(data.message);
    });

    newSocket.on("admin-rejoined", () => {
      setIsAdminLeft(false);
    });

    return () => {
      newSocket.off("team-session-started");
      newSocket.off("kicked");
      newSocket.off("session-terminated");
      newSocket.off("permission-updated");
      newSocket.off("join-request-received");
      newSocket.off("receive-chat");
      newSocket.off("chat-status-updated");
      newSocket.off("chats-cleared");
      newSocket.off("admin-disconnected");
      newSocket.off("admin-rejoined");
      newSocket.off("join-accepted");
      newSocket.off("join-rejected");
      newSocket.close();
    }
  }, []);

  // Update session credentials periodically or when session changes
  useEffect(() => {
    if (socket && sessionId) {
      socket.emit("get-session-users", sessionId, (response) => {
        setIsAdmin(response.isAdmin);
        setCanDraw(response.canDraw);
        setIsChatEnabled(response.chatEnabled ?? true);
      });
    } else {
      setIsAdmin(false);
      setCanDraw(true);
      setIsChatEnabled(true);
      setJoinRequests([]); // Reset requests on session exit
      setChatMessages([]); // Reset chat on session exit
      setHasUnreadMessages(false);
      setIsAdminLeft(false);
    }
  }, [socket, sessionId]);

  // Warn user on page reload/unload if they are in an active session
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (sessionId) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave the collaborative drawing session?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId]);

  // Sync session state to sessionStorage
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem("activeSessionId", sessionId);
      sessionStorage.setItem("activeSessionIsAdmin", JSON.stringify(isAdmin));
      if (teamInfo) {
        sessionStorage.setItem("activeSessionTeamInfo", JSON.stringify(teamInfo));
      } else {
        sessionStorage.removeItem("activeSessionTeamInfo");
      }
    } else {
      sessionStorage.removeItem("activeSessionId");
      sessionStorage.removeItem("activeSessionIsAdmin");
      sessionStorage.removeItem("activeSessionTeamInfo");
    }
  }, [sessionId, isAdmin, teamInfo]);

  // On mount/socket-connect, check if there is an active session in sessionStorage to auto-rejoin
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem("activeSessionId");
    const savedIsAdmin = JSON.parse(sessionStorage.getItem("activeSessionIsAdmin") || "false");
    const savedTeamInfo = JSON.parse(sessionStorage.getItem("activeSessionTeamInfo") || "null");
    
    if (socket && savedSessionId) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user._id;
      const username = user.name || "User";
      
      if (savedIsAdmin) {
        // Rejoin as admin
        socket.emit("rejoin-session", { sessionId: savedSessionId, userId, username }, (res) => {
          if (res && res.success) {
            setSessionId(savedSessionId);
            setIsAdmin(true);
            if (savedTeamInfo) {
              setTeamInfo(savedTeamInfo);
            }
            if (res.drawingData) {
              setPreviousSessionData({ success: true, drawingData: res.drawingData });
              setDrawingData(res.drawingData);
            } else if (savedTeamInfo) {
              // Also reload drawing data from DB as fallback
              socket.emit("load-previous-session", { teamId: savedTeamInfo.teamId || null }, (sessionRes) => {
                if (sessionRes && sessionRes.success) {
                  if (sessionRes.drawingData) {
                    setPreviousSessionData(sessionRes);
                    setDrawingData(sessionRes.drawingData);
                  }
                  if (sessionRes.chatHistory) {
                    setChatMessages(sessionRes.chatHistory);
                  }
                }
              });
            }
            if (res.chatHistory) {
              setChatMessages(res.chatHistory);
            }
          } else {
            sessionStorage.removeItem("activeSessionId");
            sessionStorage.removeItem("activeSessionIsAdmin");
            sessionStorage.removeItem("activeSessionTeamInfo");
          }
        });
      }
    }
  }, [socket]);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0a0a0c] overflow-hidden relative">
      
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      
      {/* Dedicated Corner Glow Blobs (positioned under the canvas z-index stack) */}
      <div className="absolute top-[-80px] left-[-80px] w-[350px] h-[350px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] bg-pink-500/15 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header Area */}
      <div className="w-full flex justify-center pt-3.5 pb-1 relative z-50 shrink-0 px-4">
        <Navbar 
          socket={socket} 
          sessionId={sessionId} 
          setSessionId={setSessionId} 
          isAdmin={isAdmin} 
          setIsAdmin={setIsAdmin}
          onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
          joinRequestsCount={joinRequests.length}
          setTeamInfo={setTeamInfo}
          setPreviousSessionData={setPreviousSessionData}
          setDrawingData={setDrawingData}
          setChatMessages={setChatMessages}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-row min-h-0 mx-3 mb-3 gap-3 relative z-10">
        
        {/* Canvas area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 border border-white/10 bg-[#121214]/60 backdrop-blur-md rounded-2xl overflow-hidden relative z-10 min-w-0"
        >
          <CanvasBoard 
            socket={socket} 
            sessionId={sessionId} 
            canDraw={canDraw}
            previousSessionData={previousSessionData}
            teamInfo={teamInfo}
            drawingData={drawingData}
            setDrawingData={setDrawingData}
          />
          
          {/* Chat Toggle Button (Only visible if in session but chat is closed) */}
          {sessionId && !isChatOpen && (
            <button
              onClick={() => {
                setIsChatOpen(true);
                setHasUnreadMessages(false);
              }}
              className="absolute bottom-6 right-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full p-4 shadow-xl transition-all hover:scale-105 active:scale-95 z-50 border border-white/10 cursor-pointer"
              title="Open Chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {hasUnreadMessages && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white/20"></span>
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Side Panels */}
        {sessionId && (isChatOpen || isParticipantsOpen) && (
          <div className="w-80 flex flex-col gap-3 relative z-40 shrink-0 h-full">
            {isParticipantsOpen && (
              <div className="flex-1 min-h-0 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col bg-[#121214]/90">
                <ParticipantsPanel 
                  socket={socket} 
                  sessionId={sessionId} 
                  isAdmin={isAdmin}
                  joinRequests={joinRequests}
                  setJoinRequests={setJoinRequests}
                  onClose={() => setIsParticipantsOpen(false)} 
                />
              </div>
            )}
            {isChatOpen && (
              <div className="flex-1 min-h-0 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col bg-[#121214]/90">
                <ChatPanel 
                  socket={socket} 
                  sessionId={sessionId} 
                  messages={chatMessages}
                  isAdmin={isAdmin}
                  isChatEnabled={isChatEnabled}
                  onClose={() => setIsChatOpen(false)} 
                />
              </div>
            )}
          </div>
        )}

      </div>
      {inviteData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-sm shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Team Session Started</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                <strong className="text-indigo-400">{inviteData.adminName}</strong> has started a session for <strong className="text-white">{inviteData.teamName}</strong>.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  if (inviteData?.sessionId) {
                    ignoredSessionsRef.current.add(inviteData.sessionId);
                  }
                  setInviteData(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold active:scale-[0.99] cursor-pointer"
              >
                Ignore
              </button>
              <button
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem("user") || "{}");
                  const username = user.name || "User";
                  socket.emit("join-team-session", { sessionId: inviteData.sessionId, password: null, username }, (res) => {
                    if (res && res.success) {
                      setSessionId(inviteData.sessionId);
                      setIsAdmin(false);
                      setCanDraw(res.canDraw);
                      setTeamInfo(inviteData); // Store team info to identify team sessions
                      // Set active drawing data directly from the join response
                      if (res.drawingData) {
                        setPreviousSessionData({ success: true, drawingData: res.drawingData });
                        setDrawingData(res.drawingData);
                      }
                      if (res.chatHistory) {
                        setChatMessages(res.chatHistory);
                      }
                    } else if(res && !res.success) {
                      showAlert("Error", res.message || "Failed to join team session.");
                    }
                  });
                  setInviteData(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all font-semibold shadow-[0_4px_12px_rgba(99,102,241,0.2)] active:scale-[0.99] cursor-pointer text-xs"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal 
        isOpen={alertConfig.isOpen} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} 
      />
      {isAdminLeft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-sm shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative flex flex-col p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Admin Disconnected</h3>
            <p className="text-gray-300 text-xs leading-relaxed mb-4">
              {adminLeftMessage || "The admin has left the session. The system is waiting for the admin to return..."}
            </p>
            <div className="flex justify-center items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Waiting for rejoin...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
