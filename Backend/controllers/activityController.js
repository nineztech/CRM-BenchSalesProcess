import Activity from "../models/activityModel.js";
import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";
import { sequelize } from "../config/dbConnection.js";

// Function to create default activities for all models
export const createDefaultActivities = async () => {
  try {
    const defaultActivities = [
      // Lead Activities
      {
        name: "Lead Management",
        category: "Lead",
        description: "Manage leads including creation, updates, and status changes",
        viewRoute: "/leadcreation",
        addRoute: "/leadcreation",
        editRoute: "/leadcreation",
        deleteRoute: "/leadcreation",
        status: "active"
      },
      {
        name: "Lead Assignment Management",
        category: "Lead",
        description: "Manage lead assignments and transfers between users",
        viewRoute: "/leadcreation",
        addRoute: "/leadcreation",
        editRoute: "/leadcreation",
        deleteRoute: "/leadcreation",
        status: "active"
      },
      {
        name: "Lead Status Management",
        category: "Lead",
        description: "Manage and update lead statuses",
        viewRoute: "/leadcreation",
        addRoute: "/leadcreation",
        editRoute: "/leadcreation",
        deleteRoute: "/leadcreation",
        status: "active"
      },
      {
        name: "Archived Lead Management",
        category: "Lead",
        description: "View and manage archived leads, including reopening leads",
        viewRoute: "/archived-leads",
        addRoute: "/archived-leads",
        editRoute: "/archived-leads",
        deleteRoute: "/archived-leads",
        status: "active"
      },
      
      // User Activities
      {
        name: "User Management",
        category: "User",
        description: "Manage system users including creation and modification",
        viewRoute: "/users",
        addRoute: "/users",
        editRoute: "/users",
        deleteRoute: "/users",
        status: "active"
      },
      {
        name: "Admin Management",
        category: "User",
        description: "Manage admin users and their privileges",
        viewRoute: "/admins",
        addRoute: "/admins",
        editRoute: "/admins",
        deleteRoute: "/admins",
        status: "active"
      },

      // Department Activities
      {
        name: "Department Management",
        category: "Department",
        description: "Manage departments, their configurations, and subroles",
        viewRoute: "/departments",
        addRoute: "/departments",
        editRoute: "/departments",
        deleteRoute: "/departments",
        status: "active"
      },

      // Package Activities
      {
        name: "Package Management",
        category: "Package",
        description: "Manage service packages, pricing, and configurations",
        viewRoute: "/adminpackages",
        addRoute: "/adminpackages",
        editRoute: "/adminpackages",
        deleteRoute: "/adminpackages",
        status: "active"
      },

      // System Activities
      {
        name: "Activity Management",
        category: "System",
        description: "Manage system activities and their permissions",
        viewRoute: "/roles",
        addRoute: "/roles",
        editRoute: "/roles",
        deleteRoute: "/roles",
        status: "active"
      },
      {
        name: "Role Permission Management",
        category: "System",
        description: "Manage role-based permissions and access controls",
        viewRoute: "/department-permissions",
        addRoute: "/department-permissions",
        editRoute: "/department-permissions",
        deleteRoute: "/department-permissions",
        status: "active"
      }
    ];

    for (const activity of defaultActivities) {
      await Activity.findOrCreate({
        where: { name: activity.name },
        defaults: activity
      });
    }

    console.log('✅ Default activities created successfully');
  } catch (error) {
    console.error('Error creating default activities:', error);
    throw error;
  }
};

// Add Activity
export const addActivity = async (req, res) => {
  try {
    const { name, status, viewRoute, addRoute, editRoute, deleteRoute, description } = req.body;
    const userId = req.user?.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    const newActivity = await Activity.create({
      name: name.trim(),
      status: status || 'active',
      viewRoute,
      addRoute,
      editRoute,
      deleteRoute,
      description,
      createdBy: userId
    });

    const activityWithDetails = await Activity.findByPk(newActivity.id, {
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
      message: "Activity created successfully",
      data: activityWithDetails
    });

  } catch (error) {
    console.error("Error creating activity:", error);
    handleError(error, res);
  }
};

// Get All Activities
export const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
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
      data: activities
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    handleError(error, res);
  }
};

// Get Activity by ID
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    handleError(error, res);
  }
};

// Update Activity
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, viewRoute, addRoute, editRoute, deleteRoute, description } = req.body;
    const userId = req.user?.id;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    await activity.update({
      name: name?.trim() || activity.name,
      status: status || activity.status,
      viewRoute: viewRoute || activity.viewRoute,
      addRoute: addRoute || activity.addRoute,
      editRoute: editRoute || activity.editRoute,
      deleteRoute: deleteRoute || activity.deleteRoute,
      description: description !== undefined ? description : activity.description,
      updatedBy: userId
    });

    const updatedActivity = await Activity.findByPk(id, {
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
      message: "Activity updated successfully",
      data: updatedActivity
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    handleError(error, res);
  }
};

// Delete Activity
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    await activity.destroy();

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    handleError(error, res);
  }
};

// Get Activities by Department
export const getActivitiesByDepartment = async (req, res) => {
  try {
    const { dept_id } = req.params;

    const department = await Department.findByPk(dept_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    const activities = await Activity.findAll({
      where: sequelize.literal(`JSON_CONTAINS(dept_ids, '${dept_id}')`),
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
      data: activities
    });
  } catch (error) {
    console.error("Error fetching department activities:", error);
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