import express from 'express';
import {
  addRolePermission,
  getAllRolePermissions,
  getRolePermissionById,
  updateRolePermission,
  deleteRolePermission,
  getRolePermissionsByDepartment
} from '../controllers/rolePermissionController.js';
import authentication from '../middleware/auth.js';

const router = express.Router();

// RolePermission routes (protected with authentication)
router.post("/add", authentication, addRolePermission);
router.get("/all", authentication, getAllRolePermissions);
router.get("/department/:dept_id", authentication, getRolePermissionsByDepartment);
router.get("/:id", authentication, getRolePermissionById);
router.put("/:id", authentication, updateRolePermission);
router.delete("/:id", authentication, deleteRolePermission);

export default router; 