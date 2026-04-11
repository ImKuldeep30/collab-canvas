import { useState, useEffect } from "react";
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

  const showAlert = (title, message) => {
    setAlertConfig({ isOpen: true, title, message });
  };

  useEffect(() => {
    const newSocket = io("http://192.168.1.10:4000"); // Socket connection available only after successful login
    setSocket(newSocket);

    // Global session events
    newSocket.on("kicked", (data) => {
      showAlert("Session Ended", data.message);
      setSessionId(null);
      setIsAdmin(false);
      setChatMessages([]);
    });

    newSocket.on("session-terminated", (data) => {
      showAlert("Session Ended", data.message);
      setSessionId(null);
      setIsAdmin(false);
      setChatMessages([]);
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
    });

    newSocket.on("chat-status-updated", (data) => {
      setIsChatEnabled(data.enabled);
    });

    newSocket.on("chats-cleared", () => {
      setChatMessages([]);
    });

    return () => {
      newSocket.off("kicked");
      newSocket.off("session-terminated");
      newSocket.off("permission-updated");
      newSocket.off("join-request-received");
      newSocket.off("receive-chat");
      newSocket.off("chat-status-updated");
      newSocket.off("chats-cleared");
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
    }
  }, [socket, sessionId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#171717] overflow-hidden">

      {/* Top Header Area */}
      <div className="w-full flex justify-center py-2 relative z-50 shrink-0 px-4">
        <Navbar 
          socket={socket} 
          sessionId={sessionId} 
          setSessionId={setSessionId} 
          isAdmin={isAdmin} 
          onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
          joinRequestsCount={joinRequests.length}
        />
        
        {/* Blinking Session ID Box */}
        {sessionId && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
            <span className="text-emerald-400 text-sm font-bold tracking-wider flex items-center gap-2.5 bg-[#171717] py-2 px-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] uppercase">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              ID: {sessionId}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-row min-h-0 mx-2 mb-2 gap-2">
        
        {/* Canvas area */}
        <div className="flex-1 border-3 border-white/20 backdrop-blur-md rounded-2xl overflow-hidden relative z-10 min-w-0" >
          <CanvasBoard socket={socket} sessionId={sessionId} canDraw={canDraw} />
          
          {/* Chat Toggle Button (Only visible if in session but chat is closed) */}
          {sessionId && !isChatOpen && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105 z-40 border border-white/10"
              title="Open Chat"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}
        </div>

        {/* Right Side Panels */}
        {sessionId && (isChatOpen || isParticipantsOpen) && (
          <div className="w-80 flex flex-col gap-2 relative z-40 shrink-0 h-full">
            {isParticipantsOpen && (
              <div className="flex-1 min-h-0 border-3 border-white/20 shadow-xl backdrop-blur-md rounded-2xl overflow-hidden flex flex-col bg-[#1f1f1f]">
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
              <div className="flex-1 min-h-0 border-3 border-white/20 shadow-xl backdrop-blur-md rounded-2xl overflow-hidden flex flex-col">
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

      <AlertModal 
        isOpen={alertConfig.isOpen} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })} 
      />
    </div>
  );
}
