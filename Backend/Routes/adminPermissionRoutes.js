import express from 'express';
import {
  addOrUpdateAdminPermission,
  getAdminPermissions,
  getAllAdminPermissions,
  deleteAdminPermission,
  initializeAdminPermissions
} from '../controllers/adminPermissionController.js';
import authentication from '../middleware/auth.js';

const router = express.Router();

// Admin Permission routes (protected with authentication)
router.post("/add", authentication, addOrUpdateAdminPermission);
router.get("/all", authentication, getAllAdminPermissions);
router.get("/admin/:admin_id", getAdminPermissions);
router.post("/initialize/:admin_id", authentication, initializeAdminPermissions);
router.delete("/:id", authentication, deleteAdminPermission);

export default router; 