import {
  createResumeChecklist,
  getAllResumeChecklists,
  getResumeChecklistsByUser,
  getResumeChecklistById,
  updateResumeChecklist,
  updateResumeChecklistStatus,
  deleteResumeChecklist,
  getResumeChecklistFilterOptions
} from '../controllers/resumeChecklistController.js'
import express from 'express'
import authenticate from '../middleware/auth.js'

const resumeChecklistRoute = express.Router()

// Create new resume checklist
resumeChecklistRoute.post("/add", authenticate, createResumeChecklist)

// Get all resume checklists with filtering and pagination
resumeChecklistRoute.get("/", getAllResumeChecklists)

// Get resume checklists created by logged-in user
resumeChecklistRoute.get("/user", authenticate, getResumeChecklistsByUser)

// Get filter options (creators and statuses)
resumeChecklistRoute.get("/filter-options", authenticate, getResumeChecklistFilterOptions)

// Get filter options for user's resume checklists
resumeChecklistRoute.get("/user/filter-options", authenticate, getResumeChecklistFilterOptions)

// Get resume checklist by ID
resumeChecklistRoute.get("/:id", getResumeChecklistById)

// Update resume checklist
resumeChecklistRoute.put("/:id", authenticate, updateResumeChecklist)

// Update resume checklist status
resumeChecklistRoute.patch("/:id/status", authenticate, updateResumeChecklistStatus)

// Delete resume checklist
resumeChecklistRoute.delete("/:id", authenticate, deleteResumeChecklist)

export default resumeChecklistRoute
