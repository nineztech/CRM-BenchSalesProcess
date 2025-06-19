import RolePermission from "../models/rolePermissionModel.js";
import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";
import Activity from "../models/activityModel.js";
import Permission from "../models/permissionsModel.js";

// Add RolePermission
export const addRolePermission = async (req, res) => {
  try {
    const { dept_id, subrole, hasAccessTo } = req.body;
    const userId = req.user?.id;

    if (!dept_id || !subrole || !hasAccessTo) {
      return res.status(400).json({
        success: false,
        message: "Department ID, subrole, and access permissions are required"
      });
    }

    // Check if department exists and subrole is valid
    const department = await Department.findByPk(dept_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    if (!department.subroles.includes(subrole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subrole for this department"
      });
    }

    // Check if role permission already exists for this department and subrole
    const existingRolePermission = await RolePermission.findOne({
      where: { dept_id, subrole }
    });

    // if (existingRolePermission) {
    //   return res.status(409).json({
    //     success: false,
    //     message: "Role permission already exists for this department and subrole"
    //   });
    // }

    // Validate hasAccessTo format and activity IDs
    for (const [activityId, permissionIds] of Object.entries(hasAccessTo)) {
      // Validate activity
      const activity = await Activity.findByPk(activityId);
      if (!activity) {
        return res.status(400).json({
          success: false,
          message: `Invalid activity ID: ${activityId}`
        });
      }
      if (activity.dept_id !== dept_id) {
        return res.status(400).json({
          success: false,
          message: `Activity ${activityId} does not belong to the specified department`
        });
      }

      // Validate permission IDs
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          message: `Permissions for activity ${activityId} must be an array of permission IDs`
        });
      }

      // Check if all permission IDs exist
      for (const permId of permissionIds) {
        const permission = await Permission.findByPk(permId);
        if (!permission) {
          return res.status(400).json({
            success: false,
            message: `Invalid permission ID: ${permId}`
          });
        }
      }
    }

    const newRolePermission = await RolePermission.create({
      dept_id,
      subrole,
      hasAccessTo,
      createdBy: userId
    });

    const rolePermissionWithDetails = await RolePermission.findByPk(newRolePermission.id, {
      include: [
        {
          model: Department,
          as: 'department'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Role permission created successfully",
      data: rolePermissionWithDetails
    });

  } catch (error) {
    console.error("Error creating role permission:", error);
    handleError(error, res);
  }
};

// Get All RolePermissions
export const getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermission.findAll({
      include: [
        {
          model: Department,
          as: 'department'
        },
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
      data: rolePermissions
    });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    handleError(error, res);
  }
};

// Get RolePermission by ID
export const getRolePermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rolePermission = await RolePermission.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: "Role permission not found"
      });
    }

    res.status(200).json({
      success: true,
      data: rolePermission
    });
  } catch (error) {
    console.error("Error fetching role permission:", error);
    handleError(error, res);
  }
};

// Update RolePermission
export const updateRolePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasAccessTo } = req.body;
    const userId = req.user?.id;

    const rolePermission = await RolePermission.findByPk(id, {
      include: [{ model: Department, as: 'department' }]
    });

    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: "Role permission not found"
      });
    }

    // Validate hasAccessTo format and activity IDs if provided
    if (hasAccessTo) {
      for (const [activityId, permissionIds] of Object.entries(hasAccessTo)) {
        // Validate activity
        const activity = await Activity.findByPk(activityId);
        if (!activity) {
          return res.status(400).json({
            success: false,
            message: `Invalid activity ID: ${activityId}`
          });
        }
        if (activity.dept_id !== rolePermission.dept_id) {
          return res.status(400).json({
            success: false,
            message: `Activity ${activityId} does not belong to the department`
          });
        }

        // Validate permission IDs
        if (!Array.isArray(permissionIds)) {
          return res.status(400).json({
            success: false,
            message: `Permissions for activity ${activityId} must be an array of permission IDs`
          });
        }

        // Check if all permission IDs exist
        for (const permId of permissionIds) {
          const permission = await Permission.findByPk(permId);
          if (!permission) {
            return res.status(400).json({
              success: false,
              message: `Invalid permission ID: ${permId}`
            });
          }
        }
      }
    }

    await rolePermission.update({
      hasAccessTo: hasAccessTo || rolePermission.hasAccessTo,
      updatedBy: userId
    });

    const updatedRolePermission = await RolePermission.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Role permission updated successfully",
      data: updatedRolePermission
    });
  } catch (error) {
    console.error("Error updating role permission:", error);
    handleError(error, res);
  }
};

// Delete RolePermission
export const deleteRolePermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rolePermission = await RolePermission.findByPk(id);
    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: "Role permission not found"
      });
    }

    await rolePermission.destroy();

    res.status(200).json({
      success: true,
      message: "Role permission deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting role permission:", error);
    handleError(error, res);
  }
};

// Get RolePermissions by Department
export const getRolePermissionsByDepartment = async (req, res) => {
  try {
    const { dept_id } = req.params;

    const department = await Department.findByPk(dept_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    const rolePermissions = await RolePermission.findAll({
      where: { dept_id },
      include: [
        {
          model: Department,
          as: 'department'
        },
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
      data: rolePermissions
    });
  } catch (error) {
    console.error("Error fetching department role permissions:", error);
    handleError(error, res);
  }
};

// Error handler
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

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};