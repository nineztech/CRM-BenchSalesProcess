import userRoute from './userRoutes.js'
import adminRoute from './adminRoutes.js'
import leadRoute from './leadRoutes.js'
import DepartmentRoute from './departmentRoutes.js'
import PackagesRoute from './packagesRoutes.js'
import LeadAssignRoute from './leadAssignmentRoutes.js'
import activityRoutes from './activityRoutes.js'
import permissionsRoutes from './permissionsRoutes.js'
import rolePermissionRoutes from './rolePermissionRoutes.js'
import adminPermissionRoutes from './adminPermissionRoutes.js'
import archivedLeadRoutes from './archivedLeadRoutes.js'
import specialUserPermissionRoutes from './specialUserPermissionRoutes.js'

import express from 'express'
const router = express.Router()

router.use("/user", userRoute)
router.use("/admin", adminRoute)
router.use("/lead", leadRoute)
router.use("/department", DepartmentRoute)
router.use("/packages", PackagesRoute)
router.use("/lead-assignments", LeadAssignRoute)
router.use('/activity', activityRoutes)
router.use('/permissions', permissionsRoutes)
router.use('/role-permissions', rolePermissionRoutes)
router.use('/admin-permissions', adminPermissionRoutes)
router.use('/archived-leads', archivedLeadRoutes)
router.use('/special-user-permission', specialUserPermissionRoutes)

export default router