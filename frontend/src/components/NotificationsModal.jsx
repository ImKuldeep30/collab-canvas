import React, { useState, useEffect } from "react";
import { X, Bell, Check } from "lucide-react";
import axios from "axios";
import AlertModal from "./AlertModal";

const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "Notification", message: "" });

  const showAlert = (title, message) => {
    setAlertConfig({ isOpen: true, title, message });
  };

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
      const response = await axios.get((import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + "/api/teams/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (teamId, userId, action) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post((import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + `/api/teams/handle-request`, 
        { teamId, userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove handled notification from list
      setNotifications((prev) => prev.filter(n => !(n.teamId === teamId && n.user._id === userId)));
    } catch (err) {
      showAlert("Action Failed", err.response?.data?.message || "Action failed");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="bg-[#121214]/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Bell className="text-indigo-400" size={18} />
            Notifications
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/15 text-rose-400 p-4 rounded-xl flex items-center gap-3">
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-xs text-gray-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-5 shadow-[0_8px_32px_rgba(99,102,241,0.08)]">
                <Bell size={28} className="text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-base font-extrabold text-white">No New Notifications</h3>
              <p className="text-xs text-gray-400 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                You're all caught up on join requests and collaborative team notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-black/40 border border-white/10 rounded-2xl p-4.5 flex flex-col gap-3.5 transition-all duration-200 shadow-inner">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center text-xs font-bold uppercase text-white shadow-inner shrink-0">
                      {getInitials(notification.user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs leading-relaxed">
                        <span className="font-extrabold text-gray-200">{notification.user?.name || "Unknown"}</span> requested to join <span className="font-extrabold text-indigo-400">{notification.teamName}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{notification.user?.email || ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 justify-end mt-1 pt-3.5 border-t border-white/5">
                    <button 
                      onClick={() => handleAction(notification.teamId, notification.user?._id, "approve")} 
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(notification.teamId, notification.user?._id, "deny")} 
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all border border-white/10 hover:border-white/20 flex items-center gap-1.5 text-xs font-bold cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <X size={14} /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <AlertModal
          isOpen={alertConfig.isOpen}
          title={alertConfig.title}
          message={alertConfig.message}
          type="alert"
          onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        />
      </div>
    </div>
  );
};

export default NotificationsModal;