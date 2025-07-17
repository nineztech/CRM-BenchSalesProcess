import RolePermission from "../models/rolePermissionModel.js";
import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";
import Activity from "../models/activityModel.js";

import SpecialUserPermission from "../models/specialUserPermissionModel.js";

// Add RolePermission
export const addRolePermission = async (req, res) => {
  try {
    const { activity_id, dept_id, subrole, canView, canAdd, canEdit, canDelete } = req.body;
    const userId = req.user?.id;

    if (!activity_id || !dept_id || !subrole) {
      return res.status(400).json({
        success: false,
        message: "Activity ID, department ID, and subrole are required"
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

    // Check if activity exists
    const activity = await Activity.findByPk(activity_id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    let rolePermissionWithDetails;

    // Find or create role permission
    const [rolePermission, created] = await RolePermission.findOrCreate({
      where: {
        activity_id,
        dept_id,
        subrole
      },
      defaults: {
        canView: canView || false,
        canAdd: canAdd || false,
        canEdit: canEdit || false,
        canDelete: canDelete || false,
        createdBy: userId
      }
    });

    if (!created) {
      // Update existing permission
      await rolePermission.update({
        canView: canView || false,
        canAdd: canAdd || false,
        canEdit: canEdit || false,
        canDelete: canDelete || false,
        updatedBy: userId
      });
    }

    // Get role permission with details
    rolePermissionWithDetails = await RolePermission.findByPk(rolePermission.id, {
      include: [
        {
          model: Department,
          as: 'roleDepartment'
        },
        {
          model: Activity,
          as: 'roleActivity'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    // Find all special users in this department with this role
    const specialUsers = await User.findAll({
      where: {
        departmentId: dept_id,
        subrole: subrole,
        is_special: true
      }
    });

    // For each special user, create or update their special permission
    if (specialUsers.length > 0) {
      for (const user of specialUsers) {
        // Check if special permission exists
        const [specialPermission, specialCreated] = await SpecialUserPermission.findOrCreate({
          where: {
            user_id: user.id,
            activity_id,
            dept_id,
            subrole
          },
          defaults: {
            canView: canView || false,
            canAdd: canAdd || false,
            canEdit: canEdit || false,
            canDelete: canDelete || false,
            createdBy: userId
          }
        });

        if (!specialCreated) {
          // If special permission exists, only update if it has less permissions than role
          const shouldUpdate = (
            (!specialPermission.canView && canView) ||
            (!specialPermission.canAdd && canAdd) ||
            (!specialPermission.canEdit && canEdit) ||
            (!specialPermission.canDelete && canDelete)
          );

          if (shouldUpdate) {
            await specialPermission.update({
              canView: specialPermission.canView || canView || false,
              canAdd: specialPermission.canAdd || canAdd || false,
              canEdit: specialPermission.canEdit || canEdit || false,
              canDelete: specialPermission.canDelete || canDelete || false,
              updatedBy: userId
            });
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: created ? "Role permission created successfully" : "Role permission updated successfully",
      data: rolePermissionWithDetails
    });

  } catch (error) {
    console.error("Error managing role permission:", error);
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
          as: 'roleDepartment'
        },
        {
          model: Activity,
          as: 'roleActivity'
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
          as: 'roleDepartment'
        },
        {
          model: Activity,
          as: 'roleActivity'
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
    const { canView, canAdd, canEdit, canDelete } = req.body;
    const userId = req.user?.id;

    const rolePermission = await RolePermission.findByPk(id, {
      include: [{ model: Department, as: 'roleDepartment' }]
    });

    if (!rolePermission) {
      return res.status(404).json({
        success: false,
        message: "Role permission not found"
      });
    }

    await rolePermission.update({
      canView: typeof canView === 'boolean' ? canView : rolePermission.canView,
      canAdd: typeof canAdd === 'boolean' ? canAdd : rolePermission.canAdd,
      canEdit: typeof canEdit === 'boolean' ? canEdit : rolePermission.canEdit,
      canDelete: typeof canDelete === 'boolean' ? canDelete : rolePermission.canDelete,
      updatedBy: userId
    });

    const updatedRolePermission = await RolePermission.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'roleDepartment'
        },
        {
          model: Activity,
          as: 'roleActivity'
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
    const { role } = req.query;

    console.log('Fetching permissions for department:', dept_id, 'role:', role);

    const department = await Department.findByPk(dept_id);
    if (!department) {
      console.log('Department not found:', dept_id);
      return res.status(404).json({
        success: false,
        message: `Department with ID ${dept_id} not found`
      });
    }

    // Build where clause based on whether role is specified
    const whereClause = {
      dept_id
    };
    
    if (role) {
      whereClause.subrole = role;
    }

    console.log('Using where clause:', whereClause);

    const rolePermissions = await RolePermission.findAll({
      where: whereClause,
      include: [
        {
          model: Department,
          as: 'roleDepartment'
        },
        {
          model: Activity,
          as: 'roleActivity'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${rolePermissions.length} permissions`);

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