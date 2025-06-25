import express from 'express';
import {
  createSpecialUserPermissions,
  getSpecialUserPermissions,
  updateSpecialUserPermission
} from '../controllers/specialUserPermissionController.js';
import authentication from '../middleware/auth.js';

const router = express.Router();

// Special User Permission routes (protected with authentication)
router.post("/create/:user_id", authentication, createSpecialUserPermissions);
router.get("/:user_id", authentication, getSpecialUserPermissions);
router.put("/:id", authentication, updateSpecialUserPermission);

export default router; 