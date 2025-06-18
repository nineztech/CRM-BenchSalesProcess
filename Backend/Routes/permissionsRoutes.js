import express from 'express';
import {
  addPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission
} from '../controllers/permissionsController.js';
import authentication from '../middleware/auth.js';

const router = express.Router();

// Permission routes (protected with authentication)
router.post("/add", authentication, addPermission);
router.get("/all", getAllPermissions);
router.get("/:id", getPermissionById);
router.put("/:id", authentication, updatePermission);
router.delete("/:id", authentication, deletePermission);

export default router; 