import React, { useState } from 'react';
import { X, Users, Sparkles, FileText, Check, Copy } from 'lucide-react';
import axios from 'axios';

const CreateTeamModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        (import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + '/api/teams/create',
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessData(response.data.team);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (successData?.teamId) {
      navigator.clipboard.writeText(successData.teamId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    setSuccessData(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Users className="text-indigo-400" size={18} />
            Create Team
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {successData ? (
          <div className="text-center py-2 space-y-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_8px_32px_rgba(16,185,129,0.08)]">
              <Check size={28} strokeWidth={2.5} className="text-emerald-400 animate-pulse" />
            </div>
            
            <div>
              <h3 className="text-base font-extrabold text-white mb-2">Team Created!</h3>
              <p className="text-gray-300 text-xs mb-3 font-medium">Share this Team ID with your members:</p>
              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3.5 gap-3 shadow-inner">
                <span className="text-lg font-mono text-indigo-400 tracking-wider font-extrabold select-all pl-2">
                  {successData.teamId}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg transition-all cursor-pointer"
                  title="Copy Team ID"
                >
                  {copied ? <Check size={16} className="text-emerald-400 animate-in zoom-in duration-200" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-3.5 font-medium">
                Users can input this ID inside the "Join Team" section.
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/15 text-rose-400 text-xs font-semibold p-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-400" />
                Team Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Squad"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                <FileText size={12} className="text-indigo-400" />
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this team working on?"
                rows="3"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm resize-none shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer text-xs mt-2"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateTeamModal;