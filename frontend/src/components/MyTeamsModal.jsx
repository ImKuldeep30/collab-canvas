
import React, { useState, useEffect } from "react";
import { X, Users2, ShieldAlert, ArrowLeft, Check, UserMinus, Video } from "lucide-react";
import axios from "axios";

const MyTeamsModal = ({ isOpen, onClose, socket, setSessionId, setIsAdmin }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      setSelectedTeam(null);
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("http://192.168.1.10:3000/api/teams/my-teams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(response.data);
      if (selectedTeam) {
        setSelectedTeam(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`http://192.168.1.10:3000/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTeam(response.data);
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
        { teamId: selectedTeam.teamId, ...payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTeam(response.data.team);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {selectedTeam && (
              <button onClick={() => setSelectedTeam(null)} className="text-gray-400 hover:text-white transition-colors p-1 bg-white/5 rounded-lg hover:bg-white/10">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users2 className="text-green-400" size={24} />
              {selectedTeam ? selectedTeam.name : "My Teams"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && !selectedTeam && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <ShieldAlert size={20} />
              <p>{error}</p>
            </div>
          )}
          
          {detailsLoading ? (
             <div className="text-center py-10 flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
               <p className="text-gray-400">Loading details...</p>
             </div>
          ) : selectedTeam ? (
            <div className="space-y-6">
               <div className="bg-[#252525] border border-white/5 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">Details</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded shrink-0 font-mono">
                        ID: {selectedTeam.teamId}
                      </span>
                      {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && socket && (
                        <button 
                          onClick={() => {
                            const username = currentUser.name || "Admin";
                            socket.emit("create-session", { password: null, username }, (response) => {
                              setSessionId(response.sessionId);
                                setIsAdmin(true);
                                
                                const membersIds = selectedTeam.members.map(m => m._id);
                                socket.emit("invite-team-to-session", {
                                  sessionId: response.sessionId,
                                  teamName: selectedTeam.name,
                                  adminName: currentUser.name || "Admin",
                                  members: membersIds
                              });
                              
                              onClose();
                            });
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-lg"
                        >
                          <Video size={14} /> Start Session
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{selectedTeam.description || "No description provided."}</p>
                  <div className="text-xs text-gray-500 mt-2 font-medium">Created by {selectedTeam.createdBy.name}</div>
               </div>

               {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && selectedTeam.pendingMembers?.length > 0 && (
                 <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500 mb-3 px-1">Join Requests ({selectedTeam.pendingMembers.length})</h3>
                    <div className="space-y-2">
                      {selectedTeam.pendingMembers.map(user => (
                        <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#2a2a2a] p-3 rounded-xl border border-yellow-500/30 gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAction("handle-request", { userId: user._id, action: "approve" })} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium" title="Approve">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={() => handleAction("handle-request", { userId: user._id, action: "deny" })} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium" title="Deny">
                              <X size={14} /> Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-green-500 mb-3 px-1">Members ({selectedTeam.members.length})</h3>
                  <div className="space-y-2">
                    {selectedTeam.members.map(member => (
                      <div key={member._id} className="flex items-center justify-between bg-[#252525] p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold uppercase text-xs">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white max-w-[200px] truncate">{member.name} {member._id === (selectedTeam.createdBy?._id || selectedTeam.createdBy) && <span className="text-xs text-yellow-400 ml-1 font-mono">(Admin)</span>}</p>
                            <p className="text-xs text-gray-400 max-w-[200px] truncate">{member.email}</p>
                          </div>
                        </div>
                        {((currentUser.id || currentUser._id) === (selectedTeam.createdBy?._id || selectedTeam.createdBy)) && member._id !== (currentUser.id || currentUser._id) && (
                           <button onClick={() => handleAction("kick", { userId: member._id })} className="p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-1" title="Kick from Team">
                             <UserMinus size={18} /> <span className="text-xs hidden sm:block font-medium">Kick</span>
                           </button>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ) : loading ? (
            <div className="text-center py-10 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-400">Loading your teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center">
              <Users2 size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-300">You haven't joined any teams yet.</p>
              <p className="text-sm mt-2">Create a new team or join an existing one using an invite code.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team._id} onClick={() => loadTeamDetails(team.teamId)} className="cursor-pointer bg-[#252525] border border-white/5 rounded-xl p-5 hover:border-green-500/30 hover:bg-[#2a2a2a] transition-all group relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white truncate pr-4">{team.name}</h3>
                    <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded shrink-0 font-mono">
                      {team.teamId}
                    </span>
                  </div>
                  {team.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">{team.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <Users2 size={14} />
                      {team.members.length} member{team.members.length !== 1 && "s"}
                    </div>
                    <div>
                      by {team.createdBy.name}
                    </div>
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

export default MyTeamsModal;