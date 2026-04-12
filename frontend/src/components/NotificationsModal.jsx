import React, { useState, useEffect } from "react";
import { X, Bell, Check, Users2 } from "lucide-react";
import axios from "axios";

const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("http://192.168.1.10:3000/api/teams/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (teamId, userId, action) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`http://192.168.1.10:3000/api/teams/handle-request`, 
        { teamId, userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove handled notification from list
      setNotifications((prev) => prev.filter(n => !(n.teamId === teamId && n.user._id === userId)));
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="text-orange-400" size={24} />
            Notifications
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-10 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center">
              <Bell size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-300">No new notifications</p>
              <p className="text-sm mt-2">You're all caught up on requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-[#252525] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                      <Users2 size={20} />
                    </div>
                    <div>
                      <p className="text-white text-sm">
                        <span className="font-bold">{notification.user.name}</span> requested to join <span className="font-bold text-indigo-400">{notification.teamName}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{notification.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-white/5">
                    <button 
                      onClick={() => handleAction(notification.teamId, notification.user._id, "approve")} 
                      className="px-4 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(notification.teamId, notification.user._id, "deny")} 
                      className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <X size={14} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;