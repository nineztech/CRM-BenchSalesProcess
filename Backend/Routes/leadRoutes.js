import {
  createLead,
  getAllLeads,
  getLeadsByStatus,
  getLeadsByStatusGroup,
  updateLead,
  updateLeadStatus,
  archiveLead,
  getAssignedLeads,
  updateTeamFollowupStatus,
  toggleTeamFollowup
} from '../controllers/leadController.js'
import express from 'express'
import authenticate from '../middleware/auth.js'

const leadRoute = express.Router()

// Create new lead
leadRoute.post("/add",authenticate, createLead)

// Get all leads with filtering and pagination
leadRoute.get("/", getAllLeads)

// Get leads assigned to logged-in user
leadRoute.get("/assigned", authenticate, getAssignedLeads)

// Get leads by status group (open, converted, archived, inProcess, followUp)
leadRoute.get("/group/:statusGroup", getLeadsByStatusGroup)

// Get leads by specific status
leadRoute.get("/status/:status", getLeadsByStatus)

// Update lead
leadRoute.put("/:id", authenticate, updateLead)

// Update lead status
leadRoute.patch("/:id/status", authenticate, updateLeadStatus)

// Update team follow-up status
leadRoute.patch("/:id/team-followup", authenticate, updateTeamFollowupStatus)

// Toggle team follow-up flag
leadRoute.patch("/:id/toggle-team-followup", authenticate, toggleTeamFollowup)

// Archive lead
leadRoute.post("/:id/archive", authenticate, archiveLead)

export default leadRoute