import {
  addPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage
} from '../controllers/packagesController.js'
import authentication from '../middleware/auth.js'
import express from 'express'

const router = express.Router()

// Packages routes (protected with authentication where needed)
router.post("/add", authentication, addPackage)
router.get("/all", getAllPackages)
router.get("/:id", getPackageById)
router.put("/:id", authentication, updatePackage)
router.delete("/:id", authentication, deletePackage)

export default router 