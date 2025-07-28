import express from 'express';
import {
  createInstallment,
  createCombinedInstallments,
  getInstallmentsByEnrolledClient,
  getInstallmentById,
  updateInstallment,
  deleteInstallment,
  adminInstallmentApproval,
  salesInstallmentApproval,
  getPaymentControlInstallments,
  updatePaymentStatus,
  updatePaymentControlInstallment
} from '../controllers/installmentsController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Create new installment
router.post('/', verifyToken, createInstallment);

// Create combined installments for offer letter and first year
router.post('/combined', verifyToken, createCombinedInstallments);

// Payment control routes (must come before parameterized routes)
router.get('/payment-control', verifyToken, getPaymentControlInstallments);
router.put('/payment-status/:id', verifyToken, updatePaymentStatus);
router.put('/payment-control/:id', verifyToken, updatePaymentControlInstallment);

// Get all installments for an enrolled client
router.get('/enrolled-client/:enrolledClientId', getInstallmentsByEnrolledClient);

// Admin approval/rejection route
router.put('/admin/approval/:id', verifyToken, adminInstallmentApproval);

// Sales approval/rejection route
router.put('/sales/approval/:id', verifyToken, salesInstallmentApproval);

// Get single installment by ID
router.get('/:id', getInstallmentById);

// Update installment
router.put('/:id', verifyToken, updateInstallment);

// Delete installment
router.delete('/:id', verifyToken, deleteInstallment);

export default router; 