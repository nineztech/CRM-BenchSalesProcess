import {addDepartment} from '../controllers/departmentController.js'
import authentication from '../middleware/auth.js'
import express from 'express'

const leadRoute = express.Router()

leadRoute.post("/add",authentication,addDepartment)
// leadRoute.get("/getLeads",getAllLeads)

export default leadRoute