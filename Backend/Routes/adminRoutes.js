const express = require('express');
const router = express.Router();
const { createAdmin } = require('../controllers/adminController');

router.post('/create', createAdmin);

module.exports = router;
