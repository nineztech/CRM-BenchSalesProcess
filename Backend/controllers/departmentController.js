import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";

// Add Department
export const addDepartment = async (req, res) => {
  try {
    const { departmentName, roles } = req.body;
    const userId = req.user?.id; // Assuming you have user info from auth middleware

    // Validation
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

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      where: { departmentName: departmentName.trim() }
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists"
      });
    }

    // Prepare roles array
    let rolesArray = [];
    if (roles) {
      if (Array.isArray(roles)) {
        rolesArray = roles.filter(r => r && r.trim() !== '').map(r => r.trim());
      } else if (typeof roles === 'string') {
        rolesArray = [roles.trim()];
      }
    }

    // Create department
    const newDepartment = await Department.create({
      departmentName: departmentName.trim(),
      roles: rolesArray,
      createdBy: userId,
      status: 'active'
    });

    // Fetch the created department with user details
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
  }
};
