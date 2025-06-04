const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateDepartmentSequence
} = require('../controllers/departmentController');

// PUT /api/departments/reorder - Update department sequence/order (MUST be before /:id route)
router.put('/reorder', updateDepartmentSequence);

// GET /api/departments - Get all departments
router.get('/', getAllDepartments);

// GET /api/departments/:id - Get department by ID
router.get('/:id', getDepartmentById);

// POST /api/departments - Create new department
router.post('/', createDepartment);

// PUT /api/departments/:id - Update department
router.put('/:id', updateDepartment);

// DELETE /api/departments/:id - Delete department
router.delete('/:id', deleteDepartment);

module.exports = router;