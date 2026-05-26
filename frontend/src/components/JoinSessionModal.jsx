import React, { useState } from 'react';
import { X, AlertCircle, KeyRound, Radio, ShieldAlert } from 'lucide-react';

const JoinSessionModal = ({ isOpen, onClose, socket, setSessionId }) => {
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleJoin = () => {
    if (!socket || !sessionIdInput.trim()) {
      setError("Please enter a valid Session ID.");
      return;
    }
    
    setIsJoining(true);
    setError(null);
    
    // Get username from local storage to send to admin
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const username = userData.name || "Anonymous User";
    
    socket.emit("join-request", { sessionId: sessionIdInput.trim(), password, username }, (response) => {
      if (response.success && response.pending) {
        // We wait for join-accepted or join-rejected
        setError("Waiting for admin approval...");
        
        socket.once("join-accepted", (data) => {
           setIsJoining(false);
           setSessionId(data.sessionId);
           setSessionIdInput('');
           setPassword('');
           onClose();
        });

        socket.once("join-rejected", (data) => {
           setIsJoining(false);
           setError(data.message || "Admin rejected your request.");
         });
      } else {
        setIsJoining(false);
        setError(response.message || "Failed to join session.");
      }
    });
  };

  const handleClose = () => {
    setSessionIdInput('');
    setPassword('');
    setError(null);
    onClose();
  };

  const isApprovalMessage = error === "Waiting for admin approval...";

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="bg-[#121214]/80 backdrop-blur-xl rounded-2xl w-full max-w-md border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.6)] p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-black tracking-tight text-white mb-5 flex items-center gap-2">
          <Radio size={18} className="text-indigo-400 animate-pulse" />
          Join Session
        </h2>

        {error && (
          <div className={`flex items-center p-3 rounded-xl mb-4 text-xs font-semibold gap-2 border ${
            isApprovalMessage 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
              Session ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="e.g. ab12cd34"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm uppercase tracking-widest font-mono font-bold shadow-inner"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={12} className="text-indigo-400" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter session password if private"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm shadow-inner"
            />
            <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
              <ShieldAlert size={12} className="text-gray-600" />
              Leave empty if it's an open session.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold py-2.5 rounded-xl transition-all border border-white/10 hover:border-white/20 active:scale-[0.99] cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer text-xs"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinSessionModal;