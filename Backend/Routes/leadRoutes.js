import {
  createLead,
  getAllLeads,
  getLeadsByStatus,
  getLeadsByStatusGroup,
  updateLead
} from '../controllers/leadController.js'
import express from 'express'
import authenticate from '../middleware/auth.js'

const leadRoute = express.Router()

// Create new lead
leadRoute.post("/add",authenticate, createLead)

// Get all leads with filtering and pagination
leadRoute.get("/", getAllLeads)

// Get leads by status group (open, converted, archived, inProcess)
leadRoute.get("/group/:statusGroup", getLeadsByStatusGroup)

// Get leads by specific status
leadRoute.get("/status/:status", getLeadsByStatus)

// Update lead
leadRoute.put("/:id", updateLead)

export default leadRoute