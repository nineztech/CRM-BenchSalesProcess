const express = require('express');
const router = express.Router();
const { createDepartment } = require('../controllers/departmentController');

router.post('/create', createDepartment);

module.exports = router;
