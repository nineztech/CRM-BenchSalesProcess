import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Routes
router.post("/login",adminController.loginAdmin)
router.post("/register",adminController.registerAdmin)
router.get("/all",adminController.getAllAdmins)
router.put("/edit/:id",adminController.editAdmin)

export default router;