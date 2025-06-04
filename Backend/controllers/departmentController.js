const { Department } = require('../models/departmentModel');

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.getAll();
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const department = await Department.getById(parseInt(id));
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.status(200).json(department);
  } catch (error) {
    console.error('Error in getDepartmentById:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

// Create new department
const createDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;

    // Validation
    if (!department_name || department_name.trim().length === 0) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    if (department_name.trim().length > 100) {
      return res.status(400).json({ error: 'Department name must be less than 100 characters' });
    }

    // Check for duplicate name
    const isDuplicate = await Department.checkDuplicateName(department_name.trim());
    if (isDuplicate) {
      return res.status(400).json({ error: 'Department name already exists' });
    }

    const newDepartment = await Department.create({
      department_name: department_name.trim()
    });

    res.status(201).json({
      message: 'Department created successfully',
      department: newDepartment
    });
  } catch (error) {
    console.error('Error in createDepartment:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_name } = req.body;

    // Validation
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    if (!department_name || department_name.trim().length === 0) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    if (department_name.trim().length > 100) {
      return res.status(400).json({ error: 'Department name must be less than 100 characters' });
    }

    // Check for duplicate name (excluding current department)
    const isDuplicate = await Department.checkDuplicateName(department_name.trim(), parseInt(id));
    if (isDuplicate) {
      return res.status(400).json({ error: 'Department name already exists' });
    }

    const updatedDepartment = await Department.update(parseInt(id), {
      department_name: department_name.trim()
    });

    res.status(200).json({
      message: 'Department updated successfully',
      department: updatedDepartment
    });
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const result = await Department.delete(parseInt(id));
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

// Update department sequence/order
const updateDepartmentSequence = async (req, res) => {
  try {
    const { order } = req.body;

    // Validation
    if (!order || !Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'Order array is required and cannot be empty' });
    }

    // Validate each item in the order array
    for (const item of order) {
      if (!item.id || !item.sequence_number || isNaN(item.id) || isNaN(item.sequence_number)) {
        return res.status(400).json({ 
          error: 'Invalid order data format. Each item must have valid id and sequence_number' 
        });
      }
    }

    // Check for duplicate sequence numbers
    const sequenceNumbers = order.map(item => item.sequence_number);
    const uniqueSequences = [...new Set(sequenceNumbers)];
    if (sequenceNumbers.length !== uniqueSequences.length) {
      return res.status(400).json({ error: 'Duplicate sequence numbers found' });
    }

    const result = await Department.updateSequence(order);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in updateDepartmentSequence:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateDepartmentSequence
};