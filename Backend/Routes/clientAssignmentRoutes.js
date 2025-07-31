import express from 'express';
import {
  assignClient,
  getClientAssignment,
  getClientAssignmentHistory,
  getMarketingTeamLeads,
  assignEnrolledClient,
  getEnrolledClientAssignment
} from '../controllers/clientAssignmentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get marketing team leads
router.get('/marketing-team-leads', auth, getMarketingTeamLeads);

// Assign or reassign a client (POST)
router.post('/assign', auth, assignClient);

// Assign enrolled client to marketing team (POST)
router.post('/assign-enrolled', auth, assignEnrolledClient);

// Get current assignment for a client (GET)
router.get('/:clientId', auth, getClientAssignment);

// Get current assignment for an enrolled client (GET)
router.get('/enrolled/:clientId', auth, getEnrolledClientAssignment);

// Get assignment history for a client (GET)
router.get('/history/:clientId', auth, getClientAssignmentHistory);

export default router; 