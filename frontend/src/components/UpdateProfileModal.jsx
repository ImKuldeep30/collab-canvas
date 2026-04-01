import React, { useState } from 'react';
import { X } from 'lucide-react';

const UpdateProfileModal = ({ isOpen, onClose, user, setUser }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:3000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess(data.message || "Profile updated successfully!");
      if (data.user) {
        // We merged properties because isVerified comes from data.user, but updateProfile might not return it natively. 
        // Backend updateProfile returns { id, name, email }. It doesn't return isVerified. We just merge.
        setUser(prev => ({ ...prev, ...data.user, isVerified: email !== prev?.email ? false : prev?.isVerified }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-2xl border border-white/10 shadow-2xl p-6 relative transform transition-all">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Update Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#242424] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-500"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-[#242424] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-500"
              placeholder="Your Email"
            />
          </div>

          {error && <p className="text-rose-500 text-sm py-1">{error}</p>}
          {success && <p className="text-emerald-400 text-sm py-1">{success}</p>}

          <button 
            type="submit"
            disabled={loading || (name === user?.name && email === user?.email)}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfileModal;
