const express = require('express');
const router = express.Router();
const { createTeam, joinTeam, getMyTeams, getNotifications, getTeamDetails, handleJoinRequest, kickMember, editDescription, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createTeam);
router.post('/join', protect, joinTeam);
router.get('/my-teams', protect, getMyTeams);
router.get('/notifications', protect, getNotifications);
router.post('/edit-description', protect, editDescription);
router.post('/delete', protect, deleteTeam);
router.get('/:teamId', protect, getTeamDetails);
router.post('/handle-request', protect, handleJoinRequest);
router.post('/kick', protect, kickMember);

module.exports = router;