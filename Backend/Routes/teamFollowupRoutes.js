import express from 'express';
import {
  createTeamFollowup,
  getTeamFollowups,
  updateTeamFollowupStatus,
  getAssignedTeamFollowups
} from '../controllers/teamFollowupController.js';
import authenticateToken  from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new team followup
router.post('/create', createTeamFollowup);

// Get all team followups (with optional status filter)
router.get('/all', getTeamFollowups);

// Get team followups assigned to logged-in user
router.get('/assigned', getAssignedTeamFollowups);

// Update team followup status
router.patch('/:id/status', updateTeamFollowupStatus);

export default router; 