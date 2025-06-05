import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Routes
router.post("/login",adminController.loginAdmin)
router.post("/register",adminController.registerAdmin)

export default router;