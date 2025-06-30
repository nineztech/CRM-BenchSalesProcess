import SpecialUserPermission from "../models/specialUserPermissionModel.js";
import RolePermission from "../models/rolePermissionModel.js";
import Department from "../models/departmentModel.js";
import Activity from "../models/activityModel.js";
import User from "../models/userModel.js";

// Create or Update special user permissions
export const createSpecialUserPermissions = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { activity_id, canView, canAdd, canEdit, canDelete } = req.body;
    const userId = req.user?.id;

    // Find the user and check if they are special
    const user = await User.findByPk(user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // If user is not special, return error
    if (!user.is_special) {
      return res.status(400).json({
        success: false,
        message: "This user is not marked as a special user. Please use role permissions instead."
      });
    }

    // Check if the activity exists
    const activity = await Activity.findByPk(activity_id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // Find existing special permission for this activity
    const existingPermission = await SpecialUserPermission.findOne({
      where: {
        user_id: user.id,
        activity_id,
        dept_id: user.departmentId,
        subrole: user.subrole
      }
    });

    // Get role permission as base permissions
    const rolePermission = await RolePermission.findOne({
      where: {
        activity_id,
        dept_id: user.departmentId,
        subrole: user.subrole
      }
    });

    let specialPermission;

    if (existingPermission) {
      // Update existing permission while preserving existing rights
      // Only update the rights that are explicitly set in the request
      specialPermission = await existingPermission.update({
        canView: typeof canView === 'boolean' ? canView : existingPermission.canView,
        canAdd: typeof canAdd === 'boolean' ? canAdd : existingPermission.canAdd,
        canEdit: typeof canEdit === 'boolean' ? canEdit : existingPermission.canEdit,
        canDelete: typeof canDelete === 'boolean' ? canDelete : existingPermission.canDelete,
        updatedBy: userId
      });
    } else {
      // Create new special permission
      // Use role permissions as base and override with provided values
      specialPermission = await SpecialUserPermission.create({
        user_id: user.id,
        activity_id,
        dept_id: user.departmentId,
        subrole: user.subrole,
        // If explicit permission is provided, use it; otherwise use role permission or false
        canView: typeof canView === 'boolean' ? canView : rolePermission?.canView || false,
        canAdd: typeof canAdd === 'boolean' ? canAdd : rolePermission?.canAdd || false,
        canEdit: typeof canEdit === 'boolean' ? canEdit : rolePermission?.canEdit || false,
        canDelete: typeof canDelete === 'boolean' ? canDelete : rolePermission?.canDelete || false,
        createdBy: userId
      });
    }

    // Fetch the updated permission with all relations
    const updatedPermission = await SpecialUserPermission.findByPk(specialPermission.id, {
      include: [
        {
          model: Activity,
          as: 'permissionActivity'
        },
        {
          model: Department,
          as: 'permissionDepartment'
        },
        {
          model: User,
          as: 'permissionOwner',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: existingPermission ? 
        "Special user permission updated successfully" : 
        "Special user permission created successfully",
      data: updatedPermission
    });

  } catch (error) {
    console.error("Error managing special user permission:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get special user permissions
export const getSpecialUserPermissions = async (req, res) => {
  try {
    const { user_id } = req.params;

    // First check if user exists and is special
    const user = await User.findByPk(user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.is_special) {
      return res.status(400).json({
        success: false,
        message: "This user is not a special user. Please check role permissions instead."
      });
    }

    const permissions = await SpecialUserPermission.findAll({
      where: { user_id },
      include: [
        {
          model: Activity,
          as: 'permissionActivity'
        },
        {
          model: Department,
          as: 'permissionDepartment'
        },
        {
          model: User,
          as: 'permissionOwner',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'permissionCreatedBy',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'permissionUpdatedBy',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error("Error fetching special user permissions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update specific special user permission
export const updateSpecialUserPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { canView, canAdd, canEdit, canDelete } = req.body;
    const userId = req.user?.id;

    // Find the permission and include the user information
    const permission = await SpecialUserPermission.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'permissionOwner',
        attributes: ['id', 'is_special']
      }]
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found"
      });
    }

    // Check if the user is still a special user
    if (!permission.permissionOwner?.is_special) {
      return res.status(400).json({
        success: false,
        message: "This user is no longer a special user. Please use role permissions instead."
      });
    }

    await permission.update({
      canView: typeof canView === 'boolean' ? canView : permission.canView,
      canAdd: typeof canAdd === 'boolean' ? canAdd : permission.canAdd,
      canEdit: typeof canEdit === 'boolean' ? canEdit : permission.canEdit,
      canDelete: typeof canDelete === 'boolean' ? canDelete : permission.canDelete,
      updatedBy: userId
    });

    // Fetch updated permission with all relations
    const updatedPermission = await SpecialUserPermission.findByPk(permission.id, {
      include: [
        {
          model: Activity,
          as: 'permissionActivity'
        },
        {
          model: Department,
          as: 'permissionDepartment'
        },
        {
          model: User,
          as: 'permissionOwner',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Special user permission updated successfully",
      data: updatedPermission
    });

  } catch (error) {
    console.error("Error updating special user permission:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}; 