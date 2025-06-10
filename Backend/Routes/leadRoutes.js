import {
  createLead,
  getAllLeads,
  getLeadsByStatus,
  updateLead
} from '../controllers/leadController.js'
import express from 'express'

const leadRoute = express.Router()

// Create new lead
leadRoute.post("/add", createLead)

// Get all leads with filtering and pagination
leadRoute.get("/", getAllLeads)

// Get leads by status
leadRoute.get("/status/:status", getLeadsByStatus)

// Update lead
leadRoute.put("/:id", updateLead)

export default leadRoute