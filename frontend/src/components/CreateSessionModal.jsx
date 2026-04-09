import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

const CreateSessionModal = ({ isOpen, onClose, socket, setSessionId }) => {
  const [password, setPassword] = useState('');
  const [generatedSessionId, setGeneratedSessionId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!socket) return;
    setIsCreating(true);
    
    // Get username from local storage to define admin
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const username = userData.name || "Admin";

    socket.emit("create-session", { password, username }, (response) => {
      setGeneratedSessionId(response.sessionId);
      setSessionId(response.sessionId);
      setIsCreating(false);
    });
  };

  const copyToClipboard = () => {
    if (generatedSessionId) {
      navigator.clipboard.writeText(generatedSessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setPassword('');
    setGeneratedSessionId(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
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

        <h2 className="text-2xl font-bold text-white mb-6">Create Session</h2>

        {!generatedSessionId ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password (Optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secret code"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for an open session</p>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check size={32} />
            </div>
            
            <div>
              <p className="text-gray-300 mb-2">Your session is ready!</p>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 gap-2">
                <span className="text-lg font-mono text-indigo-400 tracking-wider font-bold">
                  {generatedSessionId}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy ID"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">Share this ID and your password to let others join.</p>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              Start Drawing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSessionModal;