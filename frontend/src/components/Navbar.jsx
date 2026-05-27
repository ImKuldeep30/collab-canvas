import React, { useState, useEffect, useRef } from 'react'
import { User, Settings, LogOut, Mail, CheckCircle2, XCircle, Key, UserCog, Palette, Bell, ChevronRight, Users, X, UserPlus, LogIn, Copy, Check, Info, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UpdateProfileModal from './UpdateProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import CreateSessionModal from './CreateSessionModal';
import CreateTeamModal from './CreateTeamModal';
import JoinTeamModal from './JoinTeamModal';
import MyTeamsModal from './MyTeamsModal';
import NotificationsModal from './NotificationsModal';
import JoinSessionModal from './JoinSessionModal';
import AlertModal from './AlertModal';

const Navbar = ({ socket, sessionId, setSessionId, isAdmin, setIsAdmin, onToggleParticipants, joinRequestsCount, setTeamInfo, setPreviousSessionData, setDrawingData, setChatMessages, user, setUser }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isConfirmEndSessionOpen, setIsConfirmEndSessionOpen] = useState(false);
  const [isConfirmLeaveSessionOpen, setIsConfirmLeaveSessionOpen] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  const [isMyTeamsOpen, setIsMyTeamsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [copied, setCopied] = useState(false);

  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const profileRef = useRef(null);
  const settingsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (socket && sessionId) {
      socket.emit("get-session-timer", sessionId, (res) => {
        if (res && res.expiresAt) {
          setExpiresAt(res.expiresAt);
        }
      });
    } else {
      setExpiresAt(null);
      setTimeLeft(null);
    }
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleTimerInfo = (data) => {
      if (data && data.expiresAt) {
        setExpiresAt(data.expiresAt);
      } else {
        setExpiresAt(null);
      }
    };
    
    socket.on("session-timer-info", handleTimerInfo);
    
    const handleSessionTerminated = () => {
      setExpiresAt(null);
      setTimeLeft(null);
    };
    
    socket.on("session-terminated", handleSessionTerminated);
    socket.on("kicked", handleSessionTerminated);
    
    return () => {
      socket.off("session-timer-info", handleTimerInfo);
      socket.off("session-terminated", handleSessionTerminated);
      socket.off("kicked", handleSessionTerminated);
    };
  }, [socket]);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt - now;
      
      if (remaining <= 0) {
        setTimeLeft("00:00");
        setExpiresAt(null);
        return;
      }
      
      const totalSeconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeLeft(formatted);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const res = await fetch("http://192.168.1.10:3000/api/teams/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setNotificationCount(data.length);
      }
    } catch (err) {
      console.error("Failed to fetch notification count", err);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = () => {
        setNotificationCount((prev) => prev + 1);
      };
      socket.on("new-notification", handleNewNotification);
      return () => {
        socket.off("new-notification", handleNewNotification);
      };
    }
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isProfileOpen && !hasFetched) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          let token = localStorage.getItem("accessToken");
          if (!token) throw new Error("No token found");
          
          let res = await fetch("http://192.168.1.10:3000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (res.status === 401) {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const refreshRes = await fetch("http://192.168.1.10:3000/api/auth/refresh-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
              });
              
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                token = refreshData.accessToken;
                localStorage.setItem("accessToken", token);
                
                res = await fetch("http://192.168.1.10:3000/api/auth/me", {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });
              } else {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                navigate("/");
                return;
              }
            }
          }

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const data = await res.json();
          if (!data.message) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
          }
        } catch (err) {
          console.error("Failed to fetch user:", err);
          const localUser = localStorage.getItem("user");
          if (localUser) {
            try {
              setUser(JSON.parse(localUser));
            } catch {
              console.error("Error parsing local user data");
            }
          }
        } finally {
          setLoading(false);
          setHasFetched(true);
        }
      };

      fetchUser();
    }
  }, [isProfileOpen, hasFetched, navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch("http://192.168.1.10:3000/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const handleInvite = () => {
    setIsCreateModalOpen(true);
  };

  const toggleCanvasDarkMode = async () => {
    try {
      const targetMode = !user?.canvasDarkMode;
      
      setUser(prev => ({ ...prev, canvasDarkMode: targetMode }));
      localStorage.setItem("user", JSON.stringify({ ...user, canvasDarkMode: targetMode }));

      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://192.168.1.10:3000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ canvasDarkMode: targetMode })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update preference");
      }
      
      if (data.user) {
        setUser(prev => ({ ...prev, ...data.user }));
        localStorage.setItem("user", JSON.stringify({ ...user, ...data.user }));
      }
    } catch (err) {
      console.error("Failed to save canvas mode preference:", err);
      setUser(prev => ({ ...prev, canvasDarkMode: !prev.canvasDarkMode }));
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  const handleJoin = () => {
    setIsJoinModalOpen(true);
  };

  const terminateSession = () => {
    setIsConfirmEndSessionOpen(true);
  };

  const handleConfirmTerminate = () => {
    socket.emit("terminate-session", sessionId);
    setIsConfirmEndSessionOpen(false);
  };

  const copySessionId = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <>
      <div className="h-12 w-full max-w-6xl mx-auto text-white flex items-center justify-between px-2 md:px-4 rounded-xl border border-white/15 bg-gradient-to-r from-indigo-500/[0.07] to-[#121214]/85 backdrop-blur-md shadow-[0_8px_32px_rgba(99,102,241,0.08),_0_8px_32px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300">
        
        {/* Left Side: Brand & Logo */}
        <div className="flex items-center gap-1.5 md:gap-2 cursor-pointer group" onClick={() => navigate("/main")}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Elegant 3D isometric cube logo with linear gradient faces */}
            <svg className="w-full h-full" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="face-top" x1="16" y1="3" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="face-left" x1="5" y1="16" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="face-right" x1="16" y1="16" x2="27" y2="22.5" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#db2777" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <g className="transform origin-center transition-all duration-700 ease-out group-hover:rotate-[360deg] group-hover:scale-105">
                {/* Top Face */}
                <path d="M16 3L27 9.5L16 16L5 9.5Z" fill="url(#face-top)" />
                {/* Left Face */}
                <path d="M5 9.5L16 16V29L5 22.5Z" fill="url(#face-left)" />
                {/* Right Face */}
                <path d="M27 9.5L16 16V29L27 22.5Z" fill="url(#face-right)" />
                
                {/* Sharp grid outlines */}
                <path d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5Z" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
                <path d="M16 16L5 9.5M16 16L27 9.5M16 16V29" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.3" />
              </g>
            </svg>
          </div>
          <span className="text-white font-extrabold tracking-tight text-sm md:text-base bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-purple-200 hidden sm:inline-block">
            CoCanvas
          </span>
        </div>

        {/* Center: Collaboration Session Display */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Session ID display integrated in the navbar */}
          {sessionId && (
            <div 
              onClick={copySessionId}
              className="group cursor-pointer flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg px-2 py-1 md:px-2.5 md:py-1.5 transition-all duration-200 shadow-[0_2px_10px_rgba(16,185,129,0.05)]"
              title="Click to copy Session ID"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-[10px] md:text-[11px] font-bold tracking-wider uppercase hidden sm:inline">
                ID: {sessionId}
              </span>
              {copied ? (
                <Check size={12} className="text-emerald-400 animate-in zoom-in duration-200" />
              ) : (
                <Copy size={12} className="text-emerald-500/60 group-hover:text-emerald-400 transition-colors" />
              )}
            </div>
          )}

          {sessionId && isAdmin && (
            <button
              onClick={terminateSession}
              className="text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-transparent px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer"
              title="End Session for All"
            >
              <X size={14} />
              <span className="text-[11px] font-semibold hidden lg:inline">End Session</span>
            </button>
          )}

          {sessionId && !isAdmin && (
            <button
              onClick={() => setIsConfirmLeaveSessionOpen(true)}
              className="text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-transparent px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer"
              title="Leave Session"
            >
              <LogOut size={14} />
              <span className="text-[11px] font-semibold hidden lg:inline">Leave Session</span>
            </button>
          )}

          {sessionId && (
            <button 
              onClick={onToggleParticipants}
              className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 p-1.5 rounded-lg transition-all duration-200 relative flex items-center justify-center cursor-pointer"
              title="Participants"
            >
              <Users size={16} />
              {joinRequestsCount > 0 && isAdmin && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white/20"></span>
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right Side: Collaboration Buttons, Notifications, Settings, Profile */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {timeLeft && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg font-mono text-[10px] sm:text-xs font-black animate-pulse select-none shrink-0" title="Time Remaining">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
              <span>{timeLeft}</span>
            </div>
          )}
          {/* Invite & Join buttons now placed on the right */}
          <button
            onClick={handleInvite}
            disabled={!!sessionId}
            title={sessionId ? "Cannot invite while in an active session" : ""}
            className={`px-2.5 py-1.5 md:px-3.5 md:py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 border border-indigo-500/20 ${
              sessionId 
                ? "bg-gray-500/50 cursor-not-allowed opacity-50 shadow-none text-white/50 border-none" 
                : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 shadow-[0_2px_10px_rgba(99,102,241,0.05)] cursor-pointer active:scale-95 group"
            }`}
          >
            <UserPlus size={14} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <span className="hidden lg:inline">Invite</span>
          </button>
          <button
            onClick={handleJoin}
            disabled={!!sessionId}
            title={sessionId ? "Cannot join while in an active session" : ""}
            className={`px-2.5 py-1.5 md:px-3.5 md:py-1.5 text-xs font-semibold rounded-lg text-gray-200 transition-all duration-200 flex items-center gap-1.5 ${
              sessionId
                ? "bg-white/5 border border-white/5 cursor-not-allowed opacity-50"
                : "hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer active:scale-95 group"
            }`}
          >
            <LogIn size={14} className={`transition-colors ${sessionId ? "text-gray-500" : "text-gray-300 group-hover:text-white"}`} />
            <span className="hidden lg:inline">Join</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 p-1.5 rounded-lg transition-all duration-200 relative flex items-center justify-center cursor-pointer"
              title="Notifications"
            >
              <Bell size={16} strokeWidth={2} />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 justify-center items-center text-[8px] font-extrabold text-white border border-white/20">
                    {notificationCount}
                  </span>
                </span>
              )}
            </button>
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer ${isSettingsOpen ? 'bg-white/10 text-white' : ''}`}
              title="Settings"
            >
              <Settings size={16} strokeWidth={2} />
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#121214]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.6)] p-5 flex flex-col gap-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 border-b border-white/5 mb-1.5">
                  <span className="text-gray-400 font-extrabold tracking-wider text-[10px] uppercase">System Settings</span>
                </div>

                <button
                  onClick={() => { setIsSettingsOpen(false); setIsUpdateProfileModalOpen(true); }} 
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all duration-200">
                      <UserCog size={14} />
                    </div>
                    <span className="text-xs font-bold">Update Profile</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                </button>

                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsChangePasswordModalOpen(true); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all duration-200">
                      <Key size={14} />
                    </div>
                    <span className="text-xs font-bold">Change Password</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                </button>

                <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all duration-200">
                      <Moon size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-left">Always Dark Mode</span>
                      <span className="text-[9px] text-gray-500 text-left">Force dark canvas on load</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleCanvasDarkMode}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${
                      user?.canvasDarkMode ? 'bg-indigo-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        user?.canvasDarkMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="hover:scale-105 active:scale-95 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer"
              title="User Account"
            >
              {user?.name ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/20 text-white font-bold text-xs flex items-center justify-center uppercase shadow-[0_2px_10px_rgba(99,102,241,0.2)]">
                  {getInitials(user.name)}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 hover:border-white/10 flex items-center justify-center">
                  <User size={16} strokeWidth={2} />
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#121214]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.6)] p-5 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {loading ? (
                  <div className="animate-pulse flex space-x-2.5 p-1.5">
                    <div className="rounded bg-white/10 h-8 w-8"></div>
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <div className="h-2.5 bg-white/10 rounded w-3/4"></div>
                      <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3.5 pb-3 border-b border-white/5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center text-sm font-extrabold uppercase text-white shadow-inner">
                        {getInitials(user.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-white text-sm truncate tracking-wide">{user.name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {user.isVerified ? (
                            <>
                              <CheckCircle2 size={11} className="text-emerald-400" />
                              <span className="text-[10px] text-emerald-400/90 font-semibold tracking-wide">Verified Account</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={11} className="text-rose-400" />
                              <span className="text-[10px] text-rose-400/90 font-semibold tracking-wide">Unverified Account</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors duration-200 shadow-inner">
                        <Mail size={15} className="text-indigo-400 shrink-0" />
                        <span className="text-xs text-gray-300 truncate font-semibold">{user.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                      <button 
                        onClick={() => { setIsProfileOpen(false); setIsCreateTeamOpen(true); }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
                            <Users size={14} />
                          </div>
                          <span className="text-xs font-bold">Create Team</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                      </button>

                      <button 
                        onClick={() => { setIsProfileOpen(false); setIsJoinTeamOpen(true); }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                            <UserCog size={14} />
                          </div>
                          <span className="text-xs font-bold">Join Team</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                      </button>

                      <button 
                        onClick={() => { setIsProfileOpen(false); setIsMyTeamsOpen(true); }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 group-hover:scale-105 transition-all">
                            <Users size={14} />
                          </div>
                          <span className="text-xs font-bold">My Teams</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                      </button>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all duration-200 text-xs font-extrabold border border-rose-500/20 hover:border-transparent cursor-pointer active:scale-95 shadow-md shadow-rose-500/5"
                    >
                      <LogOut size={14} strokeWidth={2.5} />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 text-[10px] py-3 flex items-center justify-center gap-1.5">
                    <Info size={12} />
                    Failed to load profile
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal mounts (OUTSIDE the containing block to prevent absolute/fixed position glitches) */}
      <UpdateProfileModal 
        isOpen={isUpdateProfileModalOpen} 
        onClose={() => setIsUpdateProfileModalOpen(false)} 
        user={user}
        setUser={setUser}
      />
      
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen} 
        onClose={() => setIsChangePasswordModalOpen(false)} 
      />

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        socket={socket}
        setSessionId={setSessionId}
        setIsAdmin={setIsAdmin}
      />
      
      <JoinSessionModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        socket={socket}
        setSessionId={setSessionId}
      />

      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
      />

      <JoinTeamModal
        isOpen={isJoinTeamOpen}
        onClose={() => setIsJoinTeamOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          fetchNotificationCount();
        }}
      />

      <MyTeamsModal
        isOpen={isMyTeamsOpen}
        onClose={() => setIsMyTeamsOpen(false)}
        socket={socket}
        sessionId={sessionId}
        setSessionId={setSessionId}
        setIsAdmin={setIsAdmin}
        setTeamInfo={setTeamInfo}
        setPreviousSessionData={setPreviousSessionData}
        setDrawingData={setDrawingData}
        setChatMessages={setChatMessages}
      />

      <AlertModal
        isOpen={isConfirmEndSessionOpen}
        title="End Session"
        message="Are you sure you want to end this session? Everyone will be kicked out."
        type="confirm"
        onConfirm={handleConfirmTerminate}
        onClose={() => setIsConfirmEndSessionOpen(false)}
      />

      <AlertModal
        isOpen={isConfirmLeaveSessionOpen}
        title="Leave Session"
        message="Are you sure you want to leave this session?"
        type="confirm"
        onConfirm={() => {
          setIsConfirmLeaveSessionOpen(false);
          socket.emit("leave-session", { sessionId });
          setSessionId(null);
        }}
        onClose={() => setIsConfirmLeaveSessionOpen(false)}
      />
    </>
  )
}

export default Navbar
