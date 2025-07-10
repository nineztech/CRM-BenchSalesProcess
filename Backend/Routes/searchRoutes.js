import express from 'express';
import { searchLeadsController } from '../controllers/searchController.js';
import authenticateUser  from '../middleware/auth.js';

const router = express.Router();

// Search leads with pagination
router.get('/leads', authenticateUser, searchLeadsController);

export default router; 