import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, X, ShieldX, UserCheck, ShieldClose } from 'lucide-react';

const ParticipantsPanel = ({ socket, sessionId, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Load initial users
    socket.emit("get-session-users", sessionId, (response) => {
      if (response && response.users) {
        setUsers(response.users);
      }
    });

    const handleUsersUpdate = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    const handleJoinRequest = (requestData) => {
      setJoinRequests((prev) => [...prev, requestData]);
    };

    socket.on("session-users-update", handleUsersUpdate);
    socket.on("join-request-received", handleJoinRequest);

    return () => {
      socket.off("session-users-update", handleUsersUpdate);
      socket.off("join-request-received", handleJoinRequest);
    };
  }, [socket, sessionId]);

  const acceptRequest = (socketId, username) => {
    socket.emit("accept-join", { sessionId, socketId, username });
    setJoinRequests(prev => prev.filter(r => r.socketId !== socketId));
  };

  const rejectRequest = (socketId) => {
    socket.emit("reject-join", { sessionId, socketId });
    setJoinRequests(prev => prev.filter(r => r.socketId !== socketId));
  };

  const toggleDraw = (targetSocketId, currentCanDraw) => {
    socket.emit("toggle-draw-permission", { sessionId, targetSocketId, canDraw: !currentCanDraw });
  };

  const kickUser = (targetSocketId) => {
    if(window.confirm("Are you sure you want to kick this user?")) {
       socket.emit("kick-user", { sessionId, targetSocketId });
    }
  };

  const terminateSession = () => {
    if(window.confirm("Terminate the entire session? This will kick everyone out.")) {
       socket.emit("terminate-session", sessionId);
    }
  };

  if (!sessionId) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition-colors duration-200 relative group p-2 rounded-lg hover:bg-white/10 flex items-center justify-center"
      >
        <Users size={18} />
        {joinRequests.length > 0 && isAdmin && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-[#171717]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#1f1f1f] rounded-2xl border-2 border-white/10 shadow-2xl p-4 flex flex-col z-50 transform origin-top-right transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users size={18} className="text-indigo-400"/> Participants 
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{users.length}</span>
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 space-y-4">
            {/* Join Requests (Admin Only) */}
            {isAdmin && joinRequests.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-2">
                <h4 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Requests to join</h4>
                {joinRequests.map((req) => (
                  <div key={req.socketId} className="flex items-center justify-between py-1 border-b border-orange-500/10 last:border-0">
                    <span className="text-sm text-gray-200">{req.username}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => acceptRequest(req.socketId, req.username)} className="p-1 text-emerald-400 hover:bg-emerald-400/20 rounded">
                         <UserCheck size={16} />
                      </button>
                      <button onClick={() => rejectRequest(req.socketId)} className="p-1 text-red-400 hover:bg-red-400/20 rounded">
                         <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* User List */}
            <div className="space-y-2">
               {users.map(([id, userData]) => {
                 const isMe = id === socket.id;
                 return (
                   <div key={id} className={`flex items-center justify-between p-2 rounded-lg ${isMe ? 'bg-indigo-500/10' : 'hover:bg-white/5'} transition-colors`}>
                     <div className="flex flex-col">
                       <span className="text-sm text-gray-200 leading-tight">
                         {userData.username || "User " + id.substring(0,4)} {isMe && "(You)"}
                       </span>
                       <span className="text-[10px] text-gray-500">
                         {userData.canDraw ? "Can draw" : "View only"}
                       </span>
                     </div>
                     
                     {/* Admin Controls */}
                     {isAdmin && !isMe && (
                       <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleDraw(id, userData.canDraw)}
                            title={userData.canDraw ? "Revoke drawing permission" : "Allow drawing"}
                            className={`p-1.5 rounded-md transition-colors ${userData.canDraw ? "text-emerald-400 hover:bg-emerald-400/20" : "text-gray-500 hover:bg-white/10 hover:text-white"}`}
                          >
                             {userData.canDraw ? <Shield size={14}/> : <ShieldClose size={14}/>}
                          </button>
                          <button 
                            onClick={() => kickUser(id)}
                            title="Kick from session"
                            className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                          >
                            <UserX size={14}/>
                          </button>
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Admin Terminate Session */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <button 
                onClick={terminateSession}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all font-medium text-sm border border-red-600/30"
              >
                <X size={16} /> End Session for All
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ParticipantsPanel;