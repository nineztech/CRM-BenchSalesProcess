import {
  addDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentRoles
  
} from '../controllers/departmentController.js'
import authentication from '../middleware/auth.js'
import express from 'express'

const router = express.Router()

// Department routes (all protected with authentication)
router.post("/add", authentication, addDepartment)
router.get("/all", getAllDepartments)
router.get("/:id", getDepartmentById)
router.get("/:id/roles", getDepartmentRoles)
router.put("/:id", authentication, updateDepartment)
router.delete("/:id", authentication, deleteDepartment)

export default router