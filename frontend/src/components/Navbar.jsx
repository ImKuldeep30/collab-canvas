import React, { useState, useEffect, useRef } from 'react'
import { User, Settings, LogOut, Mail, CheckCircle2, XCircle, Key, UserCog, Palette, Bell, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UpdateProfileModal from './UpdateProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import CreateSessionModal from './CreateSessionModal';
import JoinSessionModal from './JoinSessionModal';
import ParticipantsPanel from './ParticipantsPanel';

const Navbar = ({ socket, sessionId, setSessionId, isAdmin }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const profileRef = useRef(null);
  const settingsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close popup when clicking outside
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
          
          // Handle expired token logic
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
                
                // Retry the original request with the renewed token
                res = await fetch("http://192.168.1.10:3000/api/auth/me", {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });
              } else {
                // If refresh token is also invalid, clear storage and let ProtectedRoute handle it eventually
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
            // Cache latest user data
            localStorage.setItem("user", JSON.stringify(data));
          }
        } catch (err) {
          console.error("Failed to fetch user:", err);
          
          // Fallback to local storage cache if network or server fails
          const localUser = localStorage.getItem("user");
          if (localUser) {
            try {
              setUser(JSON.parse(localUser));
            } catch (e) {
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
      navigate("/");
    }
  };

  const handleInvite = () => {
    setIsCreateModalOpen(true);
  };

  const handleJoin = () => {
    setIsJoinModalOpen(true);
  };

  return (
    <>
    <div className="h-12 w-[95%] max-w-5xl m-2 text-white flex px-4 justify-between rounded-2xl border-3 border-white/20 bg-[#171717]">
        <div className="flex items-center gap-2 cursor-pointer group ">
          <div className="w-6 h-6 bg-linear-to-br from-indigo-500 to-purple-600 rounded-md rotate-3 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-white font-bold tracking-tight text-lg">
            CanvasHub
          </span>
        </div>

        <div className='flex gap-10 '>
            <div className="hidden md:flex items-center gap-10">
                <button
                  onClick={handleInvite}
                  className="text-gray-400 text-sm font-medium hover:text-white transition-colors duration-200 relative group"
                >
                  Invite
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                </button>
                <button
                  onClick={handleJoin}
                  className="text-gray-400 text-sm font-medium hover:text-white transition-colors duration-200 relative group"
                >
                  Join
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                </button>
                {sessionId && (
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-sm font-medium flex items-center gap-1 bg-white/5 py-1 px-2 rounded-lg border border-white/10">
                      <CheckCircle2 size={14} /> ID: {sessionId}
                    </span>
                    <ParticipantsPanel socket={socket} sessionId={sessionId} isAdmin={isAdmin} />
                  </div>
                )}
            </div>
                
            <div className="flex items-center gap-2 md:gap-10">
                <div className="relative" ref={profileRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 ${isProfileOpen ? 'bg-white/10 text-white' : ''}`}
                    >
                        <User size={20} strokeWidth={1.5} />
                    </button>

                    {/* Profile Popup */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-72 bg-[#1f1f1f] rounded-2xl border-2 border-white/10 shadow-2xl p-5 flex flex-col gap-4 z-50 transform origin-top-right transition-all">
                            {loading ? (
                                <div className="animate-pulse flex space-x-4">
                                    <div className="rounded-full bg-white/10 h-12 w-12"></div>
                                    <div className="flex-1 space-y-3 py-2">
                                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ) : user ? (
                                <>
                                    <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold uppercase text-white shadow-inner">
                                            {user.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white text-lg tracking-wide">{user.name}</span>
                                            <div className="flex items-center gap-1.5 text-xs mt-1">
                                                {user.isVerified ? (
                                                    <>
                                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                                        <span className="text-emerald-400/90 font-medium">Verified Account</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={14} className="text-rose-400" />
                                                        <span className="text-rose-400/90 font-medium">Unverified</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3 text-sm">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <Mail size={18} className="text-indigo-400" />
                                            <span className="text-gray-300 truncate font-medium">{user.email}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleLogout}
                                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all duration-200 font-semibold border border-rose-500/20 hover:border-rose-500/30"
                                    >
                                        <LogOut size={18} strokeWidth={2.5} />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-gray-400 text-sm py-4">Failed to load profile</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative" ref={settingsRef}>
                    <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 ${isSettingsOpen ? 'bg-white/10 text-white' : ''}`}
                    >
                        <Settings size={20} strokeWidth={1.5} />
                    </button>

                    {/* Settings Popup */}
                    {isSettingsOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-[#1f1f1f] rounded-2xl border-2 border-white/10 shadow-2xl p-2 flex flex-col z-50 transform origin-top-right transition-all">
                            <div className="px-3 py-2 border-b border-white/10 mb-2">
                                <span className="text-white font-semibold tracking-wide text-sm">Settings</span>
                            </div>

                            <button
                                onClick={() => { setIsSettingsOpen(false); setIsUpdateProfileModalOpen(true); }} 
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                                        <UserCog size={16} />
                                    </div>
                                    <span className="text-sm font-medium">Update Profile</span>
                                </div>
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button 
                                onClick={() => { setIsSettingsOpen(false); setIsChangePasswordModalOpen(true); }}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                                        <Key size={16} />
                                    </div>
                                    <span className="text-sm font-medium">Change Password</span>
                                </div>
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition-colors">
                                        <Bell size={16} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <span className="text-sm font-medium">Notifications</span>
                                      <span className="text-[10px] text-gray-500">Coming soon</span>
                                    </div>
                                </div>
                            </button>

                            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:text-rose-300 transition-colors">
                                        <Palette size={16} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <span className="text-sm font-medium">Appearance</span>
                                      <span className="text-[10px] text-gray-500">Coming soon</span>
                                    </div>
                                </div>
                            </button>

                        </div>
                    )}
                </div>
            </div>

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
            />
            
            <JoinSessionModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                socket={socket}
                setSessionId={setSessionId}
            />

        </div>
    </div>
    </>
  )
}

export default Navbar
