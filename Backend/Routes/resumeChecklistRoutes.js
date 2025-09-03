import {
  createResumeChecklist,
  getAllResumeChecklists,
  getResumeChecklistsByUser,
  getResumeChecklistById,
  updateResumeChecklist,
  updateResumeChecklistStatus,
  deleteResumeChecklist,
  getResumeChecklistFilterOptions,
  getEnrolledClientResume,
  getCurrentUserEnrolledClientResume,
  uploadChecklistResume,
  serveChecklistResume
} from '../controllers/resumeChecklistController.js'
import express from 'express'
import authenticate from '../middleware/auth.js'
import { resumeUpload } from '../config/multerconfig.js'

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

// Get resume from enrolled client for checklist creation
resumeChecklistRoute.get("/client/:clientUserId/resume", authenticate, getEnrolledClientResume)

// Get resume from enrolled client for current user
resumeChecklistRoute.get("/client/resume", authenticate, getCurrentUserEnrolledClientResume)

// Upload resume for checklist (only during creation)
resumeChecklistRoute.post("/:checklistId/resume", authenticate, resumeUpload.single('resume'), uploadChecklistResume)

// Serve checklist resume file
resumeChecklistRoute.get("/:checklistId/resume", serveChecklistResume)

export default resumeChecklistRoute
