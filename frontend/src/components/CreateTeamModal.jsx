import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import axios from 'axios';

const CreateTeamModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.1.10:3000/api/teams/create',
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

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-400" size={24} />
            Create Team
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {successData ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Team Created!</h3>
            <p className="text-gray-400 text-sm mb-4">Share this Team ID with your members:</p>
            <div className="bg-[#141414] p-3 rounded-lg border border-white/10 font-mono text-xl tracking-wider text-blue-400 mb-6">
              {successData.teamId}
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Team Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Awesome Builders"
                required
                className="w-full bg-[#141414] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this team about?"
                rows="3"
                className="w-full bg-[#141414] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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