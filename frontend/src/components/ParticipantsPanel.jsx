import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, X, ShieldX, UserCheck, ShieldClose, Clock } from 'lucide-react';

const ParticipantsPanel = ({ socket, sessionId, isAdmin, joinRequests, setJoinRequests, onClose }) => {
  const [users, setUsers] = useState([]);

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

    socket.on("session-users-update", handleUsersUpdate);

    return () => {
      socket.off("session-users-update", handleUsersUpdate);
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

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!sessionId) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-white w-full">
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4 shrink-0">
          <h3 className="text-white font-black tracking-tight text-sm flex items-center gap-2">
            <Users size={16} className="text-indigo-400"/> Participants 
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              {users.length}
            </span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Panel Content Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Join Requests (Admin Only) */}
          {isAdmin && joinRequests.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4.5 mb-2 space-y-3">
              <h4 className="text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="animate-pulse" />
                Requests to Join
              </h4>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div key={req.socketId} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs text-gray-200 font-bold">{req.username}</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => acceptRequest(req.socketId, req.username)} 
                        className="p-1.5 text-emerald-400 hover:bg-emerald-400/20 rounded-lg transition-colors cursor-pointer"
                        title="Accept Request"
                      >
                         <UserCheck size={14} />
                      </button>
                      <button 
                        onClick={() => rejectRequest(req.socketId)} 
                        className="p-1.5 text-rose-400 hover:bg-rose-400/20 rounded-lg transition-colors cursor-pointer"
                        title="Reject Request"
                      >
                         <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User List */}
          <div className="space-y-2.5">
             {users.map(([id, userData]) => {
               const isMe = id === socket.id;
               const username = userData.username || "User " + id.substring(0,4);
               return (
                 <div 
                   key={id} 
                   className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                     isMe 
                       ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border-indigo-500/20 shadow-inner' 
                       : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30'
                   }`}
                 >
                   <div className="flex items-center gap-3 min-w-0">
                     {/* Initials Avatar */}
                     <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center text-[10px] font-black uppercase text-white shadow-inner shrink-0">
                       {getInitials(username)}
                     </div>
                     <div className="flex flex-col min-w-0">
                       <span className="text-xs text-gray-200 font-bold leading-tight truncate">
                         {username} {isMe && <span className="text-[9px] text-indigo-400 font-black tracking-wide ml-0.5">(YOU)</span>}
                       </span>
                       <span className="text-[9px] text-gray-500 mt-0.5 font-medium">
                         {userData.canDraw ? "Can draw" : "View only"}
                       </span>
                     </div>
                   </div>
                   
                   {/* Admin Controls */}
                   {isAdmin && !isMe && (
                     <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => toggleDraw(id, userData.canDraw)}
                          title={userData.canDraw ? "Revoke drawing permission" : "Allow drawing"}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            userData.canDraw 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25" 
                              : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                           {userData.canDraw ? <Shield size={12}/> : <ShieldClose size={12}/>}
                        </button>
                        <button 
                          onClick={() => kickUser(id)}
                          title="Kick from session"
                          className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-transparent rounded-lg transition-all cursor-pointer"
                        >
                          <UserX size={12}/>
                        </button>
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPanel;