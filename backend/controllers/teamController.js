const Team = require('../models/Team');

function generateTeamId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

exports.createTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;

        const teamId = generateTeamId();

        const team = new Team({
            teamId,
            name,
            description,
            createdBy: userId,
            members: [userId]
        });

        await team.save();
        res.status(201).json({ message: 'Team created successfully', team });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.joinTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        const userId = req.user.id;

        const team = await Team.findOne({ teamId });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.members.includes(userId)) {
            return res.status(400).json({ message: 'You are already a member of this team' });
        }

        if (team.pendingMembers && team.pendingMembers.includes(userId)) {
            return res.status(400).json({ message: 'Your join request is already pending' });
        }

        if (!team.pendingMembers) {
            team.pendingMembers = [];
        }

        team.pendingMembers.push(userId);
        await team.save();

        res.status(200).json({ message: 'Join request sent successfully', team });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyTeams = async (req, res) => {
    try {
        const userId = req.user.id;
        const teams = await Team.find({ members: userId })
            .populate('members', 'name email')
            .populate('createdBy', 'name');
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const adminId = req.user.id;
        const teams = await Team.find({ createdBy: adminId })
            .populate('pendingMembers', 'name email');

        let notifications = [];
        teams.forEach(team => {
            if (team.pendingMembers && team.pendingMembers.length > 0) {
                team.pendingMembers.forEach(user => {
                    notifications.push({
                        teamId: team.teamId,
                        teamName: team.name,
                        user: { _id: user._id, name: user.name, email: user.email }
                    });
                });
            }
        });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTeamDetails = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findOne({ teamId })
            .populate('members', 'name email')
            .populate('pendingMembers', 'name email')
            .populate('createdBy', 'name');
            
        if (!team) return res.status(404).json({ message: 'Team not found' });
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.handleJoinRequest = async (req, res) => {
    try {
        const { teamId, userId, action } = req.body; // action: 'approve' or 'deny'
        const adminId = req.user.id;

        const team = await Team.findOne({ teamId });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.createdBy.toString() !== adminId) {
            return res.status(403).json({ message: 'Only admin can handle requests' });
        }

        team.pendingMembers = team.pendingMembers.filter(id => id.toString() !== userId);

        if (action === 'approve') {
            if (!team.members.includes(userId)) {
                team.members.push(userId);
            }
        }

        await team.save();
        
        // Re-fetch populated
        const updatedTeam = await Team.findOne({ teamId })
            .populate('members', 'name email')
            .populate('pendingMembers', 'name email')
            .populate('createdBy', 'name');

        res.status(200).json({ message: 'Request handled', team: updatedTeam });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.kickMember = async (req, res) => {
    try {
        const { teamId, userId } = req.body;
        const adminId = req.user.id;

        const team = await Team.findOne({ teamId });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.createdBy.toString() !== adminId) {
            return res.status(403).json({ message: 'Only admin can kick members' });
        }

        if (userId === adminId) {
            return res.status(400).json({ message: 'Cannot kick yourself' });
        }

        team.members = team.members.filter(id => id.toString() !== userId);
        await team.save();

        const updatedTeam = await Team.findOne({ teamId })
            .populate('members', 'name email')
            .populate('pendingMembers', 'name email')
            .populate('createdBy', 'name');

        res.status(200).json({ message: 'Member kicked', team: updatedTeam });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
