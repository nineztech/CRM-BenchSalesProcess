import express from 'express';
import {
  createEnrolledClient,
  getAllEnrolledClients,
  getEnrolledClientById,
  getEnrolledClientByLeadId,
  updateEnrolledClientBySales,
  adminApprovalAction,
  salesApprovalAction,
  deleteEnrolledClient,
  getAllEnrolledClientsForSales,
  getAllEnrolledClientsForAdmin,
  uploadResume,
  deleteResume,
  serveResume,
  getAllApprovedClientsSale,
  getAllApprovedAdminSale,
  updateOfferLetterCharge,
  adminOfferLetterApproval,
  updateFirstYearCharge,
  adminFirstYearApproval
} from '../controllers/enrolledClientsController.js';
import verifyToken  from '../middleware/auth.js';
import { resumeUpload } from '../config/multerconfig.js';

const router = express.Router();

// Create enrolled client (automatically called when lead status changes to enrolled)
router.post('/', verifyToken, createEnrolledClient);

// Get all enrolled clients with pagination and filtering
router.get('/', getAllEnrolledClients);
// Get all enrolled clients for sales with categorized data
router.get('/sales/all', getAllEnrolledClientsForSales);

// Get all enrolled clients for admin with categorized data
router.get('/admin/all', getAllEnrolledClientsForAdmin);
// Get enrolled client by ID
router.get('/:id', verifyToken, getEnrolledClientById);

// Get enrolled client by lead ID
router.get('/lead/:lead_id', verifyToken, getEnrolledClientByLeadId);

// Update enrolled client by sales person
router.put('/sales/:id', verifyToken, updateEnrolledClientBySales);

// Admin approval/rejection
router.put('/admin/approval/:id', verifyToken, adminApprovalAction);

// Sales approval/rejection for admin changes
router.put('/sales/approval/:id', verifyToken, salesApprovalAction);

// Delete enrolled client
router.delete('/:id', verifyToken, deleteEnrolledClient);

// Upload resume
router.post('/:id/resume', verifyToken, resumeUpload.single('resume'), uploadResume);

// Delete resume
router.delete('/:id/resume', verifyToken, deleteResume);

// Serve resume file
router.get('/:id/resume', verifyToken, serveResume);

// New routes for accounts pages
router.get('/accounts/sales', verifyToken, getAllApprovedClientsSale);
router.get('/accounts/admin', verifyToken, getAllApprovedAdminSale);

router.put('/offer-letter/:id', updateOfferLetterCharge);
router.put('/offer-letter/admin/:id', adminOfferLetterApproval);
router.put('/first-year/:id', updateFirstYearCharge);
router.put('/first-year/admin/:id', adminFirstYearApproval);

export default router; 