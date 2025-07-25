import express from 'express';
import {
  addActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivitiesByDepartment
} from '../controllers/activityController.js';
import authentication from '../middleware/auth.js';

const router = express.Router();

// Activity routes (protected with authentication)
router.post("/add", authentication, addActivity);
router.get("/all", getAllActivities);
router.get("/department/:dept_id", getActivitiesByDepartment);
router.get("/:id", getActivityById);
router.put("/:id", authentication, updateActivity);
router.delete("/:id", authentication, deleteActivity);

export default router; 