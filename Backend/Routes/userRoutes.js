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
  editUser
} from '../controllers/userController.js';

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
router.patch("/status/:id",updateOwnStatus)

export default router;