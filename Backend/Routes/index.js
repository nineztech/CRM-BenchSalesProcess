import userRoute from './userRoutes.js'
import adminRoute from './adminRoutes.js'
import leadRoute from './leadRoutes.js'
import DepartmentRoute from './departmentRoutes.js'
import express from 'express'
const router =express.Router()

router.use("/user",userRoute)
router.use("/admin",adminRoute)
router.use("/lead",leadRoute)
router.use("/department",DepartmentRoute)

export default router