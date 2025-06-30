import LeadAssignment from "../models/leadAssignmentModel.js";
import User from "../models/userModel.js";
import Lead from "../models/leadModel.js";
import { sendLeadAssignmentEmail } from '../utils/emailService.js';

// Assign Lead
export const assignLead = async (req, res) => {
  try {
    const { leadId, assignedToId, remarkText } = req.body;
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

      // Get existing remarks and ensure they have all required fields
      const existingRemarks = (existingAssignment.remark || []).map(oldRemark => ({
        changedTo: {
          to: Number(oldRemark.changedTo?.to || 0),
          from: Number(oldRemark.changedTo?.from || 0)
        },
        text: oldRemark.text || '',
        timestamp: oldRemark.timestamp || oldRemark.createdAt || new Date().toISOString()
      }));

      // Create new remark
      const newRemark = {
        changedTo: {
          to: Number(assignedToId),
          from: Number(existingAssignment.assignedToId)
        },
        text: remarkText || 'Lead reassigned',
        timestamp: new Date().toISOString()
      };
      
      const remark = [...existingRemarks, newRemark];

      await existingAssignment.update({
        assignedToId,
        previousAssignedId,
        allPreviousAssignedIds,
        updatedBy: userId,
        remark,
        reassignedBy: userId
      });

      newAssignment = existingAssignment;
    } else {
      // Create new assignment
      // Create initial remark for new assignment
      const remark = [{
        changedTo: {
          to: Number(assignedToId),
          from: 0
        },
        text: remarkText || 'Lead assigned',
        timestamp: new Date().toISOString()
      }];

      newAssignment = await LeadAssignment.create({
        leadId,
        assignedToId,
        previousAssignedId: null,
        allPreviousAssignedIds: [],
        createdBy: userId,
        status: 'active',
        remark,
        reassignedBy: null
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
        },
        {
          model: User,
          as: 'reassignedByUser',
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
        },
        {
          model: User,
          as: 'reassignedByUser',
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

    // Enhance remarks with user names for from/to
    let remarks = assignment.remark || [];
    if (remarks.length > 0) {
      // Collect all unique user IDs from changedTo.from and changedTo.to
      const userIds = new Set();
      remarks.forEach(r => {
        if (r.changedTo) {
          if (r.changedTo.from) userIds.add(r.changedTo.from);
          if (r.changedTo.to) userIds.add(r.changedTo.to);
        }
      });
      // Fetch all users in one go
      const users = await User.findAll({
        where: { id: Array.from(userIds) },
        attributes: ['id', 'firstname', 'lastname']
      });
      const userMap = {};
      users.forEach(u => {
        userMap[u.id] = `${u.firstname} ${u.lastname}`;
      });
      // Attach names to remarks
      remarks = remarks.map(r => {
        if (r.changedTo) {
          return {
            ...r,
            changedTo: {
              ...r.changedTo,
              fromName: r.changedTo.from ? userMap[r.changedTo.from] || r.changedTo.from : '',
              toName: r.changedTo.to ? userMap[r.changedTo.to] || r.changedTo.to : ''
            }
          };
        }
        return r;
      });
    }

    // Attach reassignedByUser and createdAt/updatedAt to each remark for frontend display
    remarks = remarks.map(r => ({
      ...r,
      reassignedByUser: assignment.reassignedByUser,
      createdAt: assignment.updatedAt || assignment.createdAt
    }));

    // Return remarks with names
    const assignmentData = assignment.toJSON();
    assignmentData.remark = remarks;

    res.status(200).json({
      success: true,
      data: assignmentData
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

export const notifyAssignment = async (req, res) => {
  try {
    const { leadId, assignedToId } = req.body;

    // Get lead details
    const lead = await Lead.findByPk(leadId, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get assigned user details
    const assignedUser = await User.findByPk(assignedToId);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found'
      });
    }

    // Send email notification
    const emailSent = await sendLeadAssignmentEmail(lead, assignedUser);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        emailSent
      }
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
};

export const getLeadAssignments = async (req, res) => {
  try {
    const assignments = await LeadAssignment.findAll({
      include: [
        {
          model: Lead,
          attributes: ['id', 'name', 'email', 'phone', 'technology', 'country', 'visaStatus', 'linkedinProfile']
        },
        {
          model: User,
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching lead assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead assignments'
    });
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