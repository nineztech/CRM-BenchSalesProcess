import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";

// Add Department
export const addDepartment = async (req, res) => {
  try {
    const { departmentName, roles } = req.body;
    const userId = req.user?.id;

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const existingDepartment = await Department.findOne({
      where: { departmentName: departmentName.trim() }
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists"
      });
    }

    let rolesArray = [];
    if (roles) {
      if (Array.isArray(roles)) {
        rolesArray = roles.filter(r => r && r.trim() !== '').map(r => r.trim());
      } else if (typeof roles === 'string') {
        rolesArray = [roles.trim()];
      }
    }

    const newDepartment = await Department.create({
      departmentName: departmentName.trim(),
      roles: rolesArray,
      createdBy: userId,
      status: 'active'
    });

    const departmentWithUser = await Department.findByPk(newDepartment.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: departmentWithUser
    });

  } catch (error) {
    console.error("Error creating department:", error);
    handleError(error, res);
  }
};

// Get All Departments
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    handleError(error, res);
  }
};

// Get Department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    handleError(error, res);
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName, roles, status } = req.body;
    const userId = req.user?.id;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    let rolesArray = department.roles;
    if (roles) {
      if (Array.isArray(roles)) {
        rolesArray = roles.filter(r => r && r.trim() !== '').map(r => r.trim());
      } else if (typeof roles === 'string') {
        rolesArray = [roles.trim()];
      }
    }

    await department.update({
      departmentName: departmentName?.trim() || department.departmentName,
      roles: rolesArray,
      status: status || department.status,
      updatedBy: userId
    });

    const updatedDepartment = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDepartment
    });
  } catch (error) {
    console.error("Error updating department:", error);
    handleError(error, res);
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    await department.destroy();

    res.status(200).json({
      success: true,
      message: "Department deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    handleError(error, res);
  }
};

// Get Department Roles by ID
export const getDepartmentRoles = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // Check if department is active
    if (department.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: "Department is inactive"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        departmentId: department.id,
        departmentName: department.departmentName,
        roles: department.roles || []
      }
    });

  } catch (error) {
    console.error("Error fetching department roles:", error);
    handleError(error, res);
  }
};

// Helper function to handle errors
const handleError = (error, res) => {
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: "Department name must be unique"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
