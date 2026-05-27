import React, { useState, useEffect } from 'react';
import { X, User, Mail, UserCog } from 'lucide-react';

const UpdateProfileModal = ({ isOpen, onClose, user, setUser }) => {
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch((import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + "/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess(data.message || "Profile updated successfully!");
      if (data.user) {
        setUser(prev => ({ ...prev, ...data.user }));
        localStorage.setItem("user", JSON.stringify({ ...user, ...data.user }));
      }
      
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div 
        className="w-full max-w-md bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-black tracking-tight text-white mb-5 flex items-center gap-2">
          <UserCog size={18} className="text-indigo-400" />
          Update Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
              <User size={12} className="text-indigo-400" />
              Name
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm shadow-inner"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Mail size={12} className="text-indigo-400" />
              Email Address
            </label>
            <input 
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-gray-400 cursor-not-allowed text-sm shadow-inner"
              placeholder="Your Email"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/15 p-2.5 rounded-xl mt-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/15 p-2.5 rounded-xl mt-2 animate-pulse">
              {success}
            </p>
          )}

          <button 
            type="submit"
            disabled={loading || name === user?.name}
            className="w-full mt-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfileModal;
