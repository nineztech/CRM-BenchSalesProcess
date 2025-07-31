import express from 'express';
import { searchLeadsController, searchEnrolledClientsController } from '../controllers/searchController.js';
import authenticateUser  from '../middleware/auth.js';

const router = express.Router();

// Search leads with pagination
router.get('/leads', authenticateUser, searchLeadsController);

// Search enrolled clients with pagination
router.get('/enrolled-clients', authenticateUser, searchEnrolledClientsController);

export default router; 