import Activity from "../models/activityModel.js";
import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";
import { sequelize } from "../config/dbConnection.js";

// Add Activity
export const addActivity = async (req, res) => {
  try {
    const { name, dept_ids, status, viewRoute, addRoute, editRoute, deleteRoute, description } = req.body;
    const userId = req.user?.id;

    if (!name || !dept_ids || !Array.isArray(dept_ids) || dept_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name and at least one department ID are required"
      });
    }

    // if (!viewRoute || !addRoute || !editRoute || !deleteRoute) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "All route paths (view, add, edit, delete) are required"
    //   });
    // }

    // Check if all departments exist
    const departments = await Department.findAll({
      where: {
        id: dept_ids
      }
    });

    if (departments.length !== dept_ids.length) {
      return res.status(404).json({
        success: false,
        message: "One or more department IDs are invalid"
      });
    }

    const newActivity = await Activity.create({
      name: name.trim(),
      dept_ids,
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

    // Fetch departments separately since they're stored in JSON
    const activityDepartments = await Department.findAll({
      where: {
        id: dept_ids
      },
      attributes: ['id', 'departmentName']
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: {
        ...activityWithDetails.toJSON(),
        departments: activityDepartments
      }
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

    // Fetch departments for each activity
    const activitiesWithDepts = await Promise.all(
      activities.map(async (activity) => {
        const departments = await Department.findAll({
          where: {
            id: activity.dept_ids
          },
          attributes: ['id', 'name']
        });
        return {
          ...activity.toJSON(),
          departments
        };
      })
    );

    res.status(200).json({
      success: true,
      data: activitiesWithDepts
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

    // Fetch departments separately
    const departments = await Department.findAll({
      where: {
        id: activity.dept_ids
      },
      attributes: ['id', 'name']
    });

    res.status(200).json({
      success: true,
      data: {
        ...activity.toJSON(),
        departments
      }
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
    const { name, dept_ids, status, viewRoute, addRoute, editRoute, deleteRoute, description } = req.body;
    const userId = req.user?.id;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    // If updating department IDs, validate them
    if (dept_ids) {
      if (!Array.isArray(dept_ids) || dept_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one department ID is required"
        });
      }

      const departments = await Department.findAll({
        where: {
          id: dept_ids
        }
      });

      if (departments.length !== dept_ids.length) {
        return res.status(404).json({
          success: false,
          message: "One or more department IDs are invalid"
        });
      }
    }

    await activity.update({
      name: name?.trim() || activity.name,
      dept_ids: dept_ids || activity.dept_ids,
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

    // Fetch departments separately
    const departments = await Department.findAll({
      where: {
        id: updatedActivity.dept_ids
      },
      attributes: ['id', 'name']
    });

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: {
        ...updatedActivity.toJSON(),
        departments
      }
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