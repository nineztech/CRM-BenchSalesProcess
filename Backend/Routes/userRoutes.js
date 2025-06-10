import express from 'express';
import {
  register,
  login,
  getProfile,
  logout,
  updateOwnStatus
} from '../controllers/userController.js';

const router = express.Router();

// User routes
router.post('/register', register);
router.post('/login', login);
// router.get("getAll",getAllUsers)
router.get('/profile', getProfile);
router.post('/logout', logout);
router.patch("/status/:id",updateOwnStatus)

export default router;