import {
  assignLead,
  getLeadAssignment,
  getLeadAssignmentHistory
} from '../controllers/leadAssignmentController.js'
import authentication from '../middleware/auth.js'
import express from 'express'

const router = express.Router()

// Lead Assignment routes
router.post("/assign", authentication, assignLead)
router.get("/:leadId", authentication, getLeadAssignment)
router.get("/:leadId/history", authentication, getLeadAssignmentHistory)

export default router 