import express from 'express';
import {
  assignClient,
  getClientAssignment,
  getClientAssignmentHistory,
  getMarketingTeamLeads
} from '../controllers/clientAssignmentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get marketing team leads
router.get('/marketing-team-leads', auth, getMarketingTeamLeads);

// Assign or reassign a client (POST)
router.post('/assign', auth, assignClient);

// Get current assignment for a client (GET)
router.get('/:clientId', auth, getClientAssignment);

// Get assignment history for a client (GET)
router.get('/history/:clientId', auth, getClientAssignmentHistory);

export default router; 