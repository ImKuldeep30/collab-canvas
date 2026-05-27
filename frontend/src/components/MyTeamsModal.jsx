import React, { useState, useEffect } from "react";
import { X, Users, ShieldAlert, ArrowLeft, Check, UserMinus, Video, Sparkles, Copy, Mail, Pencil, Trash2, Crown } from "lucide-react";
import axios from "axios";
import AlertModal from "./AlertModal";

const MyTeamsModal = ({ isOpen, onClose, socket, sessionId, setSessionId, setIsAdmin, setTeamInfo, setPreviousSessionData, setDrawingData, setChatMessages }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [memberToKick, setMemberToKick] = useState(null);
  const [showDurationSelect, setShowDurationSelect] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "Notification", message: "", type: "alert" });

  const showAlert = (title, message, type = "alert") => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    setIsEditingDesc(false);
    setIsConfirmingDelete(false);
    setMemberToKick(null);
    setShowDurationSelect(false);
    setAlertConfig({ isOpen: false, title: "Notification", message: "", type: "alert" });
  }, [selectedTeam]);

  const currentUser = (() => {
    try {
      const u = localStorage.getItem("user");
      return u && u !== "undefined" ? JSON.parse(u) : {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      setSelectedTeam(null);
    }
  }, [isOpen]);

  const startTeamSession = (duration) => {
    if (sessionId || !selectedTeam) return;
    const username = currentUser.name || "Admin";
    socket.emit("create-session", { 
      password: null, 
      username,
      teamId: selectedTeam.teamId,
      teamName: selectedTeam.name,
      userId: currentUser.id || currentUser._id,
      duration: duration
    }, (response) => {
      setSessionId(response.sessionId);
      setIsAdmin(true);
      if (setTeamInfo) {
        setTeamInfo({
          sessionId: response.sessionId,
          teamId: selectedTeam.teamId,
          teamName: selectedTeam.name,
          adminName: username
        });
      }
      
      // Load previous session data for the team if any exists
      if (setPreviousSessionData && setDrawingData) {
        socket.emit("load-previous-session", { teamId: selectedTeam.teamId }, (sessionRes) => {
          if (sessionRes && sessionRes.success) {
            if (sessionRes.drawingData) {
              setPreviousSessionData(sessionRes);
              setDrawingData(sessionRes.drawingData);
            }
            if (sessionRes.chatHistory && setChatMessages) {
              setChatMessages(sessionRes.chatHistory);
            }
          }
        });
      }
      
      const membersIds = (selectedTeam.members || []).map(m => m._id);
      socket.emit("invite-team-to-session", {
        sessionId: response.sessionId,
        teamName: selectedTeam.name,
        adminName: currentUser.name || "Admin",
        members: membersIds
      });
      
      onClose();
    });
  };

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get((import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + "/api/teams/my-teams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data || []);
      if (selectedTeam) {
        setSelectedTeam(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    if (!socket || !selectedTeam) return;

    const handleSessionTerminated = (data) => {
      if (activeSession && activeSession.sessionId === data.sessionId) {
        setActiveSession(null);
      }
      
      socket.emit("check-active-team-session", selectedTeam.teamId, (res) => {
        if (res && res.hasActiveSession) {
          setActiveSession(res.session);
        } else {
          setActiveSession(null);
        }
      });
    };

    const handleSessionStarted = (data) => {
      if (selectedTeam && selectedTeam.teamId === data.teamId) {
        setActiveSession({
          sessionId: data.sessionId,
          adminSocketId: data.adminSocketId,
          adminUserId: data.adminUserId || data.userId,
          teamName: data.teamName
        });
      }
    };

    socket.on("session-terminated", handleSessionTerminated);
    socket.on("team-session-started", handleSessionStarted);

    return () => {
      socket.off("session-terminated", handleSessionTerminated);
      socket.off("team-session-started", handleSessionStarted);
    };
  }, [socket, selectedTeam, activeSession]);

  const loadTeamDetails = async (teamId) => {
    setDetailsLoading(true);
    setError(null);
    setActiveSession(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`http://192.168.1.10:3000/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTeam(response.data);
      
      if (socket) {
        socket.emit("check-active-team-session", teamId, (res) => {
          if (res && res.hasActiveSession) {
            setActiveSession(res.session);
          } else {
            setActiveSession(null);
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAction = async (endpoint, payload) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(`http://192.168.1.10:3000/api/teams/${endpoint}`, 
        { teamId: selectedTeam?.teamId, ...payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTeam(response.data.team);
    } catch (err) {
      showAlert("Action Failed", err.response?.data?.message || "Action failed");
    }
  };

  const copyTeamId = (teamId) => {
    if (!teamId) return;
    navigator.clipboard.writeText(teamId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveDescription = async () => {
    if (!selectedTeam) return;
    setSavingDesc(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post((import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + "/api/teams/edit-description", 
        { teamId: selectedTeam.teamId, description: newDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTeam(response.data.team);
      setIsEditingDesc(false);
    } catch (err) {
      showAlert("Error", err.response?.data?.message || "Failed to update description");
    } finally {
      setSavingDesc(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    setDeletingTeam(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post((import.meta.env.VITE_BACKEND_URL || "http://192.168.1.10:3000") + "/api/teams/delete", 
        { teamId: selectedTeam.teamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTeam(null);
      fetchTeams();
    } catch (err) {
      showAlert("Error", err.response?.data?.message || "Failed to delete team");
    } finally {
      setDeletingTeam(false);
      setIsConfirmingDelete(false);
    }
  };

  const currentUserId = currentUser.id || currentUser._id;
  const ownedTeams = teams.filter(team => currentUserId === (team.createdBy?._id || team.createdBy));
  const memberTeams = teams.filter(team => currentUserId !== (team.createdBy?._id || team.createdBy));

  const renderTeamCard = (team) => (
    <div 
      key={team._id} 
      onClick={() => loadTeamDetails(team.teamId)} 
      className="cursor-pointer bg-black/20 border border-white/5 rounded-xl p-4 hover:border-indigo-500/30 hover:bg-black/35 transition-all duration-200 group relative flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-white text-xs truncate pr-2 group-hover:text-indigo-400 transition-colors">{team.name}</h3>
          <span className="text-[9px] bg-white/5 border border-white/5 group-hover:border-indigo-500/20 text-gray-300 px-2 py-0.5 rounded font-mono uppercase tracking-wide shrink-0">
            {team.teamId}
          </span>
        </div>
        {team.description && (
          <p className="text-gray-400 text-[11px] mb-3 line-clamp-2 leading-relaxed">{team.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2.5 border-t border-white/5">
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>{(team.members || []).length} {((team.members || []).length) === 1 ? 'member' : 'members'}</span>
        </div>
        <div className="truncate max-w-[100px]">
          by {team.createdBy?.name || "Unknown"}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative flex flex-col h-[80vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {selectedTeam && (
              <button 
                onClick={() => setSelectedTeam(null)} 
                className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-indigo-400" size={18} />
              {selectedTeam ? selectedTeam.name : "My Teams"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && !selectedTeam && (
            <div className="bg-rose-500/10 border border-rose-500/15 text-rose-400 p-4 rounded-xl flex items-center gap-3">
              <ShieldAlert size={16} className="shrink-0" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          )}
          
          {detailsLoading ? (
             <div className="text-center py-10 flex flex-col items-center">
               <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500 mb-4"></div>
               <p className="text-xs text-gray-400">Loading details...</p>
             </div>
          ) : selectedTeam ? (
            <div className="space-y-5">
               <div className="bg-black/20 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">Team Info</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Created by {selectedTeam.createdBy?.name || "Unknown"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-1 animate-in fade-in duration-200">
                          <span className="text-[10px] font-bold text-rose-400 px-1.5">Confirm Delete?</span>
                          <button
                            onClick={handleDeleteTeam}
                            disabled={deletingTeam}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            {deletingTeam ? "Deleting..." : "Yes"}
                          </button>
                          <button
                            onClick={() => setIsConfirmingDelete(false)}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors border border-white/5"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => copyTeamId(selectedTeam.teamId)}
                            className="group flex items-center gap-1.5 bg-black/40 border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 transition-all text-[11px] font-semibold text-indigo-400 cursor-pointer"
                            title="Click to copy Team ID"
                          >
                            <span className="font-mono uppercase">ID: {selectedTeam.teamId}</span>
                            {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />}
                          </button>

                          {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && (
                            <button
                              onClick={() => setIsConfirmingDelete(true)}
                              className="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg px-2.5 py-1.5 transition-all text-[11px] font-semibold cursor-pointer flex items-center gap-1 shadow-[0_2px_10px_rgba(244,63,94,0.1)]"
                              title="Delete Team"
                            >
                              <Trash2 size={12} /> Delete Team
                            </button>
                          )}
                          
                          {activeSession ? (
                            <button
                              onClick={() => {
                                const username = currentUser.name || "User";
                                const userId = currentUser.id || currentUser._id;
                                const isUserAdmin = activeSession.adminUserId === userId;
                                
                                if (isUserAdmin) {
                                  socket.emit("rejoin-session", { sessionId: activeSession.sessionId, userId, username }, (res) => {
                                    if (res && res.success) {
                                      setSessionId(activeSession.sessionId);
                                      setIsAdmin(true);
                                      if (setTeamInfo) {
                                        setTeamInfo({
                                          sessionId: activeSession.sessionId,
                                          teamId: selectedTeam.teamId,
                                          teamName: selectedTeam.name,
                                          adminName: username
                                        });
                                      }
                                      if (res.drawingData && setPreviousSessionData && setDrawingData) {
                                        setPreviousSessionData({ success: true, drawingData: res.drawingData });
                                        setDrawingData(res.drawingData);
                                      }
                                      onClose();
                                    } else {
                                      showAlert("Failed to Rejoin", res.message || "Failed to rejoin session.");
                                    }
                                  });
                                } else {
                                  socket.emit("join-request", { sessionId: activeSession.sessionId, username }, (res) => {
                                    if (res && res.success) {
                                      showAlert("Join Request Sent", "Join request sent to the admin. Please wait for approval...");
                                    } else {
                                      showAlert("Failed to Join", res.message || "Failed to send join request.");
                                    }
                                  });
                                }
                              }}
                              className={
                                activeSession.adminUserId === (currentUser.id || currentUser._id)
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-[0_2px_10px_rgba(99,102,241,0.2)] cursor-pointer"
                                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-[0_2px_10px_rgba(16,185,129,0.2)] cursor-pointer"
                              }
                            >
                              {activeSession.adminUserId === (currentUser.id || currentUser._id) ? (
                                <>
                                  <Video size={12} className="animate-pulse" /> Rejoin Session
                                </>
                              ) : (
                                <>
                                  <Sparkles size={12} /> Join Active Session
                                </>
                              )}
                            </button>
                          ) : (
                            ((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && socket && (
                              <button 
                                disabled={!!sessionId}
                                title={sessionId ? "Cannot start a new session while already in an active session" : ""}
                                onClick={() => {
                                  if (sessionId) return;
                                  setSelectedDuration(30);
                                  setShowDurationSelect(true);
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                                  sessionId 
                                    ? "bg-gray-500/50 text-gray-300 cursor-not-allowed opacity-50" 
                                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-[0_2px_10px_rgba(99,102,241,0.2)] cursor-pointer"
                                }`}
                              >
                                <Video size={12} /> Start Session
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4 mt-2">
                    {isEditingDesc ? (
                      <div className="w-full space-y-2">
                        <textarea
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                          rows={3}
                          placeholder="Enter team description..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setIsEditingDesc(false)}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveDescription}
                            disabled={savingDesc}
                            className="px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {savingDesc ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300 text-xs leading-relaxed flex-1">{selectedTeam.description || "No description provided."}</p>
                        {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && (
                          <button
                            onClick={() => {
                              setNewDesc(selectedTeam.description || "");
                              setIsEditingDesc(true);
                            }}
                            className="text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Edit Description"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
               </div>

               {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && selectedTeam.pendingMembers?.length > 0 && (
                 <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 px-1">Join Requests ({selectedTeam.pendingMembers.length})</h3>
                    <div className="space-y-2">
                      {selectedTeam.pendingMembers.map(user => (
                        <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 p-3 rounded-xl border border-amber-500/20 gap-3">
                          <div>
                            <p className="text-xs font-bold text-white">{user.name || "Unknown"}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{user.email || ""}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAction("handle-request", { userId: user._id, action: "approve" })} 
                              className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button 
                              onClick={() => handleAction("handle-request", { userId: user._id, action: "deny" })} 
                              className="px-2.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            >
                              <X size={12} /> Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2 px-1">Members ({(selectedTeam.members || []).length})</h3>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {(selectedTeam.members || []).map(member => (
                      <div key={member._id} className="flex items-center justify-between bg-black/10 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold uppercase text-[10px] shrink-0">
                            {(member.name || "?").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-[280px]">
                              {member.name || "Unknown"} 
                              {member._id === (selectedTeam.createdBy?._id || selectedTeam.createdBy) && <span className="text-[9px] text-amber-400 font-bold ml-1 font-mono uppercase tracking-wider">(Admin)</span>}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate max-w-[180px] sm:max-w-[280px] mt-0.5">{member.email || ""}</p>
                          </div>
                        </div>
                        {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && member._id !== (currentUser.id || currentUser._id) && (
                          memberToKick === member._id ? (
                            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-1 animate-in fade-in duration-200 shrink-0">
                              <span className="text-[9px] font-bold text-rose-400 px-1">Kick?</span>
                              <button 
                                onClick={() => {
                                  handleAction("kick", { userId: member._id });
                                  setMemberToKick(null);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold transition-colors cursor-pointer"
                              >
                                Yes
                              </button>
                              <button 
                                onClick={() => setMemberToKick(null)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-[9px] font-bold transition-colors border border-white/5 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setMemberToKick(member._id)} 
                              className="px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0" 
                              title="Kick from Team"
                            >
                              <UserMinus size={14} /> 
                              <span className="text-[10px] font-bold hidden sm:inline">Kick</span>
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ) : loading ? (
            <div className="text-center py-10 flex flex-col items-center">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-xs text-gray-400">Loading your teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                <Users size={24} className="opacity-40 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-300">You haven't joined any teams yet.</p>
              <p className="text-xs text-gray-500 mt-1">Create a new team or join an existing one using an invite code.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Teams Owned (Admin) Section */}
              {ownedTeams.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 px-1 flex items-center gap-1.5">
                    <Crown size={14} className="text-indigo-400" />
                    Admin ({ownedTeams.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {ownedTeams.map((team) => renderTeamCard(team))}
                  </div>
                </div>
              )}

              {/* Joined Teams (Member) Section */}
              {memberTeams.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 px-1 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-400" />
                    Joined ({memberTeams.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {memberTeams.map((team) => renderTeamCard(team))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {showDurationSelect && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-6 rounded-2xl animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 relative">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-center">Select Session Duration</h3>
              <p className="text-[11px] text-gray-400 text-center">How long should this session stay active before auto-terminating?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedDuration(30)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedDuration === 30
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-bold"
                      : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <span className="block text-xs font-semibold">30 Minutes</span>
                </button>
                <button
                  onClick={() => setSelectedDuration(60)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedDuration === 60
                      ? "border-indigo-500 bg-indigo-500/10 text-white font-bold"
                      : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <span className="block text-xs font-semibold">1 Hour</span>
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDurationSelect(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDurationSelect(false);
                    startTeamSession(selectedDuration);
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_10px_rgba(99,102,241,0.2)] cursor-pointer text-center"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        )}
        <AlertModal
          isOpen={alertConfig.isOpen}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => {
            setAlertConfig({ ...alertConfig, isOpen: false });
            if (alertConfig.title === "Join Request Sent") {
              onClose();
            }
          }}
        />
      </div>
    </div>
  );
};

export default MyTeamsModal;