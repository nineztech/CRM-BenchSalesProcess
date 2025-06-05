const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/create', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.toggleUserStatus); // New route for toggling status
router.delete('/:id', userController.deleteUser); // Keep for permanent deletion if needed

module.exports = router;