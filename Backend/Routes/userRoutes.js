import express from 'express';
import {
  register,
  login,
  getProfile,
  logout,
  updateOwnStatus,
  getAllUsers,
  getUsersByDepartment,
  deleteUser,
  editUser,
  sendOtp,
  verifyOtp,
  resetPassword,
  updateUserStatus
} from '../controllers/userController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/all', getAllUsers);
router.get('/department/:departmentId', getUsersByDepartment);
router.put('/:id', editUser);
router.delete('/:id', deleteUser);
router.get('/profile', getProfile);
router.post('/logout', logout);

// Status update route
router.patch('/:id/status', authenticateToken, updateUserStatus);

// Password reset routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;