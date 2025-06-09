import {createLead} from '../controllers/leadController.js'
import express from 'express'

const leadRoute = express.Router()

leadRoute.post("/add",createLead)
// leadRoute.get("/getLeads",getAllLeads)

export default leadRoute