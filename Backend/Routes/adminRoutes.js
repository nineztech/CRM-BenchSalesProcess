const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');

// Routes
router.get('/all', adminController.getAllAdmins);
router.post('/register', adminController.createAdmin);
router.post('/login', adminController.loginAdmin);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
