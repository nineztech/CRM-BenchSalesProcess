import express from 'express';
import {
  getAllClientUsers,
  getClientUserById,
  updateClientUser,
  resetPassword,
  toggleActiveStatus,
  loginClientUser,
  sendChangePasswordOtp,
  verifyChangePasswordOtp,
  changePassword
} from '../controllers/clientUserController.js';
import  protect  from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginClientUser);
router.post('/send-change-password-otp', sendChangePasswordOtp);
router.post('/verify-change-password-otp', verifyChangePasswordOtp);
router.post('/change-password', changePassword);

// Protected routes
// router.use(protect);

router.route('/')
  .get(getAllClientUsers);

router.route('/:id')
  .get(getClientUserById)
  .put(updateClientUser);

router.route('/:id/reset-password')
  .post(resetPassword);

router.route('/:id/toggle-status')
  .put(toggleActiveStatus);

export default router; 