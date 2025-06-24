import AdminPermission from "../models/adminPermissionModel.js";
import Activity from "../models/activityModel.js";
import User from "../models/userModel.js";

// Add or Update Admin Permission
export const addOrUpdateAdminPermission = async (req, res) => {
  try {
    const { admin_id, activity_id, canView, canAdd, canEdit, canDelete } = req.body;
    const userId = req.user?.id;

    if (!admin_id || !activity_id) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and Activity ID are required"
      });
    }

    // Check if admin exists and is actually an admin
    const admin = await User.findOne({
      where: {
        id: admin_id,
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or user is not an admin"
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

    // Find or create permission
    const [permission, created] = await AdminPermission.findOrCreate({
      where: {
        admin_id,
        activity_id
      },
      defaults: {
        canView: canView ?? true,
        canAdd: canAdd ?? true,
        canEdit: canEdit ?? true,
        canDelete: canDelete ?? true,
        createdBy: userId
      }
    });

    if (!created) {
      // Update existing permission
      await permission.update({
        canView: canView ?? permission.canView,
        canAdd: canAdd ?? permission.canAdd,
        canEdit: canEdit ?? permission.canEdit,
        canDelete: canDelete ?? permission.canDelete,
        updatedBy: userId
      });
    }

    const updatedPermission = await AdminPermission.findByPk(permission.id, {
      include: [
        {
          model: Activity,
          as: 'permissionActivity'
        },
        {
          model: User,
          as: 'permissionAdminUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'role']
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

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "Admin permission created" : "Admin permission updated",
      data: updatedPermission
    });

  } catch (error) {
    console.error("Error managing admin permission:", error);
    handleError(error, res);
  }
};

// Get Admin's Permissions
export const getAdminPermissions = async (req, res) => {
  try {
    const { admin_id } = req.params;

    // Verify admin exists
    const admin = await User.findOne({
      where: {
        id: admin_id,
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or user is not an admin"
      });
    }

    const permissions = await AdminPermission.findAll({
      where: { admin_id },
      include: [
        {
          model: Activity,
          as: 'permissionActivity'
        },
        {
          model: User,
          as: 'permissionAdminUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'role']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error("Error fetching admin permissions:", error);
    handleError(error, res);
  }
};

// Get All Admin Permissions
export const getAllAdminPermissions = async (req, res) => {
  try {
    const permissions = await AdminPermission.findAll({
      include: [
        {
          model: Activity,
          as: 'permissionActivity'
        },
        {
          model: User,
          as: 'permissionAdminUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'role']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error("Error fetching all admin permissions:", error);
    handleError(error, res);
  }
};

// Delete Admin Permission
export const deleteAdminPermission = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await AdminPermission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Admin permission not found"
      });
    }

    await permission.destroy();

    res.status(200).json({
      success: true,
      message: "Admin permission deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting admin permission:", error);
    handleError(error, res);
  }
};

// Initialize Admin Permissions
export const initializeAdminPermissions = async (req, res) => {
  try {
    const { admin_id } = req.params;

    // Verify admin exists
    const admin = await User.findOne({
      where: {
        id: admin_id,
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or user is not an admin"
      });
    }

    // Get all activities
    const activities = await Activity.findAll();

    // Create permissions for each activity
    const permissions = await Promise.all(
      activities.map(activity =>
        AdminPermission.findOrCreate({
          where: {
            admin_id,
            activity_id: activity.id
          },
          defaults: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            createdBy: req.user?.id
          }
        })
      )
    );

    res.status(200).json({
      success: true,
      message: "Admin permissions initialized successfully",
      data: permissions.map(([permission]) => permission)
    });

  } catch (error) {
    console.error("Error initializing admin permissions:", error);
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