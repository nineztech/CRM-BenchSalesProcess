const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

// Routes
router.get('/all', adminController.getAllAdmins);
router.post('/register', adminController.createAdmin);
router.post('/login', adminController.loginAdmin);
router.put('/:id', adminController.updateAdmin);
router.patch('/:id/toggle-status', adminController.toggleAdminStatus); // New route for disable/enable
router.delete('/:id', adminController.deleteAdmin); // Keep as backup

module.exports = router;