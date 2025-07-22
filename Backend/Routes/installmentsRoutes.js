import express from 'express';
import {
  createInstallment,
  getInstallmentsByEnrolledClient,
  getInstallmentById,
  updateInstallment,
  deleteInstallment,
  adminInstallmentApproval,
  salesInstallmentApproval
} from '../controllers/installmentsController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Create new installment
router.post('/', verifyToken, createInstallment);

// Get all installments for an enrolled client
router.get('/enrolled-client/:enrolledClientId', verifyToken, getInstallmentsByEnrolledClient);

// Get single installment by ID
router.get('/:id', verifyToken, getInstallmentById);

// Update installment
router.put('/:id', verifyToken, updateInstallment);

// Delete installment
router.delete('/:id', verifyToken, deleteInstallment);

// Admin approval/rejection route
router.put('/admin/approval/:id', verifyToken, adminInstallmentApproval);

// Sales approval/rejection route
router.put('/sales/approval/:id', verifyToken, salesInstallmentApproval);

export default router; 