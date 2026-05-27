import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div 
        className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.6)] p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-black tracking-tight text-white mb-5 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-400" />
          Create Session
        </h2>

        {!generatedSessionId ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={12} className="text-indigo-400" />
                Password (Optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secret code to restrict entry"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm shadow-inner"
              />
              <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
                <ShieldAlert size={12} className="text-gray-600" />
                Leave empty for an open session that anyone can join
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 shadow-inner">
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5 text-[10px] leading-relaxed">
                <span className="font-bold text-amber-500 uppercase tracking-wider text-[9px]">Local Session Warning</span>
                <p className="text-amber-400/80">
                  Data from this session will <strong className="text-amber-400">not be saved</strong> to the cloud. If the admin leaves, there is no rejoin option and all progress is lost.
                </p>
                <p className="text-amber-400/80 flex items-center gap-1">
                  💬 <strong className="text-amber-400">Chats will not be saved</strong> — messages are lost when the session ends.
                </p>
                <p className="text-amber-400/90 font-semibold mt-0.5">
                  Want to save your work &amp; chats? Create a Team instead!
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer text-xs mt-2"
            >
              {isCreating ? 'Creating Room...' : 'Create Room'}
            </button>
          </div>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-1 animate-bounce">
              <Check size={24} strokeWidth={2.5} />
            </div>
            
            <div>
              <p className="text-gray-300 text-sm mb-3 font-medium">Your session is ready! Share the ID below:</p>
              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3 gap-3 shadow-inner">
                <span className="text-lg font-mono text-indigo-400 tracking-wider font-extrabold select-all pl-2">
                  {generatedSessionId}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg transition-all cursor-pointer"
                  title="Copy ID"
                >
                  {copied ? <Check size={16} className="text-emerald-400 animate-in zoom-in duration-200" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-3 font-medium">
                Instruct collaborators to enter this ID in the "Join" panel.
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-2.5 rounded-xl transition-all shadow-[0_2px_8px_rgba(255,255,255,0.1)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs"
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