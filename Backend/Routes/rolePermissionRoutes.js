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
router.get("/all", getAllRolePermissions);
router.get("/department/:dept_id", getRolePermissionsByDepartment);
router.get("/:id", getRolePermissionById);
router.put("/:id", authentication, updateRolePermission);
router.delete("/:id", authentication, deleteRolePermission);

export default router; 