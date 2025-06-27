import {
  assignLead,
  getLeadAssignment,
  getLeadAssignmentHistory,
  getLeadAssignments,
  notifyAssignment
} from '../controllers/leadAssignmentController.js'
import authentication from '../middleware/auth.js'
import express from 'express'

const router = express.Router()

// Lead Assignment routes
router.post("/assign", authentication, assignLead)
router.get("/:leadId", getLeadAssignment)
router.get("/:leadId/history", authentication, getLeadAssignmentHistory)
router.get("/", authentication, getLeadAssignments)
router.post("/notify", authentication, notifyAssignment)

export default router 