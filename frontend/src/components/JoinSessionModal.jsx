import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-[#1f1f1f] rounded-2xl w-full max-w-md border-2 border-white/10 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Join Session</h2>

        {error && (
          <div className="flex items-center text-red-400 bg-red-400/10 p-3 rounded-lg mb-4 text-sm font-medium gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Session ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="e.g. ab12cd34"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest font-mono"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter if private"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if it's an open session.</p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2.5 rounded-xl transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
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