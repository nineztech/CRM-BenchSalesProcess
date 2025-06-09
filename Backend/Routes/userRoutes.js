const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

router.post('/create', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
