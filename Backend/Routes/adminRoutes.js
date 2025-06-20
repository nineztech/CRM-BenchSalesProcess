import express from 'express';
import { 
  registerAdmin, 
  loginAdmin, 
  getAllAdmins, 
  editAdmin,
  deleteAdmin,
  updateUserStatus,
  logoutAdmin,
  sendOtp,
  verifyOtp,
  resetPassword
} from '../controllers/adminController.js';
import  authenticateToken  from '../middleware/auth.js';

const router = express.Router();

// Admin registration route
router.post('/register', registerAdmin);

// Admin login route
router.post('/login', loginAdmin);

// Get all admins route
router.get('/all', getAllAdmins);

// Edit admin route
router.put('/:id', authenticateToken, editAdmin);

// Deactivate admin route (soft delete)
router.delete('/:id', authenticateToken, deleteAdmin);

// Update user status route
router.patch('/:id/status', authenticateToken, updateUserStatus);

// Admin logout route
router.post('/logout', authenticateToken, logoutAdmin);

// Send OTP for password reset
router.post('/send-otp', sendOtp);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset password
router.post('/reset-password', resetPassword);

export default router;