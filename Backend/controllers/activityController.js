import Activity from "../models/activityModel.js";
import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";

// Add Activity
export const addActivity = async (req, res) => {
  try {
    const { name, dept_id, status } = req.body;
    const userId = req.user?.id;

    if (!name || !dept_id) {
      return res.status(400).json({
        success: false,
        message: "Name and department ID are required"
      });
    }

    // Check if department exists
    const department = await Department.findByPk(dept_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    const newActivity = await Activity.create({
      name: name.trim(),
      dept_id,
      status: status || 'active',
      createdBy: userId
    });

    const activityWithDetails = await Activity.findByPk(newActivity.id, {
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
    const { name, dept_id, status } = req.body;
    const userId = req.user?.id;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (dept_id) {
      const department = await Department.findByPk(dept_id);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }
    }

    await activity.update({
      name: name?.trim() || activity.name,
      dept_id: dept_id || activity.dept_id,
      status: status || activity.status,
      updatedBy: userId
    });

    const updatedActivity = await Activity.findByPk(id, {
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