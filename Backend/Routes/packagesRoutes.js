import {
  addPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  togglePackageStatus,
  addDiscount,
  removeDiscount,
  getPackageDiscounts,
  updateDiscount,
  cleanupExpiredDiscounts
} from '../controllers/packagesController.js'
import authentication from '../middleware/auth.js'
import express from 'express'

const router = express.Router()

// Package routes
router.post("/add", authentication, addPackage)
router.get("/all", getAllPackages)
router.get("/:id", getPackageById)
router.put("/:id", authentication, updatePackage)
router.patch("/:id", authentication, togglePackageStatus)

// Discount routes
router.post("/:packageId/discounts", authentication, addDiscount)
router.get("/:packageId/discounts", getPackageDiscounts)
router.put("/:packageId/discounts/:discountId", authentication, updateDiscount)
router.delete("/:packageId/discounts/:discountId", authentication, removeDiscount)

// Cleanup route
router.post("/cleanup-expired-discounts", authentication, cleanupExpiredDiscounts)

export default router