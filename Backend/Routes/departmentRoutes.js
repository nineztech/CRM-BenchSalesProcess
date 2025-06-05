const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Remove the extra 'departments' prefix from routes
router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);
router.post('/reorder', departmentController.updateSequence);


module.exports = router;
