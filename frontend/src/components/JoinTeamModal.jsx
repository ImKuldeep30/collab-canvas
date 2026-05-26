import React, { useState } from 'react';
import { X, Search, UserPlus, Clock } from 'lucide-react';
import axios from 'axios';

const JoinTeamModal = ({ isOpen, onClose }) => {
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [joinedTeamName, setJoinedTeamName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.1.10:3000/api/teams/join',
        { teamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setJoinedTeamName(response.data.team.name);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTeamId('');
    setError(null);
    setSuccess(false);
    setJoinedTeamName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <UserPlus className="text-indigo-400" size={18} />
            Join Team
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_8px_32px_rgba(245,158,11,0.08)] animate-pulse">
              <Clock size={28} className="text-amber-400" />
            </div>
            <h3 className="text-base font-extrabold text-white mb-2">Request Sent!</h3>
            <p className="text-gray-300 text-xs mb-4 leading-relaxed font-medium">
              Your request to join <span className="font-semibold text-indigo-400">{joinedTeamName}</span> has been sent. You will be added once approved.
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-extrabold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs mt-2"
            >
              Back
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-400 text-xs leading-relaxed">
              Enter the unique Team ID provided by an existing member to join their team.
            </p>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/15 text-rose-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Search size={12} className="text-indigo-400" />
                Team ID
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value.trim().toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  required
                  autoComplete="off"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm tracking-widest font-mono font-bold shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !teamId.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer text-xs mt-2"
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default JoinTeamModal;