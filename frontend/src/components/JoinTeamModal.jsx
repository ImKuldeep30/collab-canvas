import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="text-purple-400" size={24} />
            Join Team
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-bold text-white mb-2">Request Sent!</h3>
            <p className="text-gray-400 text-sm mb-6">Your request to join {joinedTeamName} has been sent to the admin. You will be added once approved.</p>
            <button
              onClick={handleClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              Back
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-400 text-sm mb-6">
              Enter the unique Team ID provided by an existing member to join their team.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Team ID</label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value.trim().toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  required
                  autoComplete="off"
                  className="w-full bg-[#141414] text-white rounded-xl pl-11 pr-4 py-3 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !teamId.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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