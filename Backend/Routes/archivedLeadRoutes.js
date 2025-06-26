import express from 'express';
import { getArchivedLeads, reopenArchivedLead, getArchivedLeadById, updateArchivedLeadStatus, bulkReopenArchivedLeads } from '../controllers/archivedLeadController.js';
import  authenticate from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all archived leads with pagination and filtering
router.get('/all', getArchivedLeads);

// Get a single archived lead by ID
router.get('/:id', getArchivedLeadById);

// Bulk reopen archived leads
router.post('/bulk-reopen', bulkReopenArchivedLeads);

// Reopen an archived lead
router.post('/:id/reopen', reopenArchivedLead);

// Update archived lead status
router.patch('/:id/status', updateArchivedLeadStatus);

export default router; 