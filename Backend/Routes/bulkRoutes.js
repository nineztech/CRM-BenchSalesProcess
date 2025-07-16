import express from 'express';
import { uploadBulkLeads, downloadTemplate } from '../controllers/bulkController.js';
import  auth  from '../middleware/auth.js';

const router = express.Router();

router.post('/leads', auth, uploadBulkLeads);
router.get('/template', auth, downloadTemplate);

export default router; 