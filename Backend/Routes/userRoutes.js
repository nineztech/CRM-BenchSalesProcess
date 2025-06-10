import express from 'express';
import {
  register,
  login,
  getProfile,
  logout,
  getAllUsers,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/all', getAllUsers);
router.delete('/:id', deleteUser);
router.get('/profile', getProfile);
router.post('/logout', logout);

export default router;