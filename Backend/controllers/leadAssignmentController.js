import LeadAssignment from "../models/leadAssignmentModel.js";
import User from "../models/userModel.js";
import Lead from "../models/leadModel.js";

// Assign Lead
export const assignLead = async (req, res) => {
  try {
    const { leadId, assignedToId } = req.body;
    const userId = req.user?.id;

    if (!leadId || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Lead ID and Assigned To ID are required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Check if lead exists
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found"
      });
    }

    // Check if assigned user exists
    const assignedUser = await User.findByPk(assignedToId);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found"
      });
    }

    // Get existing assignment if any
    const existingAssignment = await LeadAssignment.findOne({
      where: { leadId, status: 'active' }
    });

    // Check if lead is already assigned to the same user
    if (existingAssignment && existingAssignment.assignedToId === assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Lead is already assigned to this user"
      });
    }

    let newAssignment;
    if (existingAssignment) {
      // Update existing assignment
      const previousAssignedId = existingAssignment.assignedToId;
      const allPreviousAssignedIds = [...(existingAssignment.allPreviousAssignedIds || []), previousAssignedId];

      await existingAssignment.update({
        assignedToId,
        previousAssignedId,
        allPreviousAssignedIds,
        updatedBy: userId
      });

      newAssignment = existingAssignment;
    } else {
      // Create new assignment
      newAssignment = await LeadAssignment.create({
        leadId,
        assignedToId,
        previousAssignedId: null,
        allPreviousAssignedIds: [],
        createdBy: userId,
        status: 'active'
      });
    }

    const assignmentWithDetails = await LeadAssignment.findByPk(newAssignment.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previousAssigned',
          attributes: ['id', 'firstname', 'lastname', 'email']
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
      message: "Lead assigned successfully",
      data: assignmentWithDetails
    });

  } catch (error) {
    console.error("Error assigning lead:", error);
    handleError(error, res);
  }
};

// Get Lead Assignment
export const getLeadAssignment = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    const assignment = await LeadAssignment.findOne({
      where: { leadId, status: 'active' },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previousAssigned',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active assignment found for this lead"
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error("Error fetching lead assignment:", error);
    handleError(error, res);
  }
};

// Get Lead Assignment History
export const getLeadAssignmentHistory = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    const assignments = await LeadAssignment.findAll({
      where: { leadId },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previousAssigned',
          attributes: ['id', 'firstname', 'lastname', 'email']
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
      data: assignments
    });
  } catch (error) {
    console.error("Error fetching lead assignment history:", error);
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

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: "Invalid reference: Lead or User not found"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}; 