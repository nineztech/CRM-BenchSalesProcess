import Permission from "../models/permissionsModel.js";
import User from "../models/userModel.js";

// Add Permission
export const addPermission = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Permission name is required"
      });
    }

    const existingPermission = await Permission.findOne({
      where: { name: name.trim() }
    });

    if (existingPermission) {
      return res.status(409).json({
        success: false,
        message: "Permission already exists"
      });
    }

    const newPermission = await Permission.create({
      name: name.trim(),
      createdBy: userId
    });

    const permissionWithDetails = await Permission.findByPk(newPermission.id, {
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
      message: "Permission created successfully",
      data: permissionWithDetails
    });

  } catch (error) {
    console.error("Error creating permission:", error);
    handleError(error, res);
  }
};

// Get All Permissions
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
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
      data: permissions
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    handleError(error, res);
  }
};

// Get Permission by ID
export const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found"
      });
    }

    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error("Error fetching permission:", error);
    handleError(error, res);
  }
};

// Update Permission
export const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found"
      });
    }

    if (name && name.trim() !== permission.name) {
      const existingPermission = await Permission.findOne({
        where: { name: name.trim() }
      });

      if (existingPermission) {
        return res.status(409).json({
          success: false,
          message: "Permission name already exists"
        });
      }
    }

    await permission.update({
      name: name?.trim() || permission.name,
      updatedBy: userId
    });

    const updatedPermission = await Permission.findByPk(id, {
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
      message: "Permission updated successfully",
      data: updatedPermission
    });
  } catch (error) {
    console.error("Error updating permission:", error);
    handleError(error, res);
  }
};

// Delete Permission
export const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found"
      });
    }

    await permission.destroy();

    res.status(200).json({
      success: true,
      message: "Permission deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting permission:", error);
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

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: "Permission name must be unique"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}; 