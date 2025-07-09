import express from 'express';
import { uploadBulkLeads } from '../controllers/bulkController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Route for bulk lead upload
router.post('/leads', auth, uploadBulkLeads);

export default router; 