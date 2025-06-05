import express from 'express';
import {
  register,
  login,
  getProfile,
  logout
} from '../controllers/userController.js';

const router = express.Router();

// User routes
router.post('/register', register);
router.post('/login', login);

// Protected routes — should be behind authentication middleware
router.get('/profile', getProfile);
router.post('/logout', logout);

export default router;
