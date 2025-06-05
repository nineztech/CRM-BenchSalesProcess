import userRoute from './userRoutes.js'
import adminRoute from './adminRoutes.js'
import express from 'express'
const router =express.Router()

router.use("/user",userRoute)
router.use("/admin",adminRoute)

export default router