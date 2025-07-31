import ClientAssignment from "../models/clientAssignmentModel.js";
import User from "../models/userModel.js";
import EnrolledClients from "../models/enrolledClientsModel.js";
import { sequelize } from "../config/dbConnection.js";
import Department from "../models/departmentModel.js";
import Lead from "../models/leadModel.js";

// Assign Client
export const assignClient = async (req, res) => {
  try {
    const { clientId, assignedToId, remarkText } = req.body;
    const userId = req.user?.id;

    console.log('Assignment request:', { clientId, assignedToId, remarkText, userId }); // Debug log

    if (!clientId || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Client ID and Assigned To ID are required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Check if client exists
    const client = await EnrolledClients.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: `Client not found with ID: ${clientId}`
      });
    }

    // Check if assigned user exists
    const assignedUser = await User.findByPk(assignedToId);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: `Assigned user not found with ID: ${assignedToId}`
      });
    }

    // Check if user is a marketing team lead
    if (assignedUser.subrole !== 'Team Lead' || !assignedUser.departmentId) {
      return res.status(400).json({
        success: false,
        message: "Selected user must be a Team Lead with a department"
      });
    }

    // Get existing assignment if any
    const existingAssignment = await ClientAssignment.findOne({
      where: { clientId, status: 'active' }
    });

    // Check if client is already assigned to the same user
    if (existingAssignment && existingAssignment.assignedToId === assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Client is already assigned to this user"
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
        text: remarkText || 'Client reassigned',
        timestamp: new Date().toISOString()
      };
      
      const remark = [...existingRemarks, newRemark];

      try {
        await existingAssignment.update({
          assignedToId,
          previousAssignedId,
          allPreviousAssignedIds,
          updatedBy: userId,
          remark,
          reassignedBy: userId
        });
        newAssignment = existingAssignment;
      } catch (updateError) {
        console.error('Error updating assignment:', updateError);
        throw new Error(`Failed to update assignment: ${updateError.message}`);
      }
    } else {
      // Create new assignment
      // Create initial remark for new assignment
      const remark = [{
        changedTo: {
          to: Number(assignedToId),
          from: 0
        },
        text: remarkText || 'Client assigned',
        timestamp: new Date().toISOString()
      }];

      try {
        newAssignment = await ClientAssignment.create({
          clientId,
          assignedToId,
          previousAssignedId: null,
          allPreviousAssignedIds: [],
          createdBy: userId,
          status: 'active',
          remark,
          reassignedBy: null
        });
      } catch (createError) {
        console.error('Error creating assignment:', createError);
        throw new Error(`Failed to create assignment: ${createError.message}`);
      }
    }

    // When fetching assignment details
    const assignmentWithDetails = await ClientAssignment.findByPk(newAssignment.id, {
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
        },
        {
          model: EnrolledClients,
          as: 'enrolledClient',
          attributes: ['id', 'lead_id', 'packageid'],
          include: [
            {
              model: Lead,
              as: 'lead',
              attributes: ['firstName', 'lastName', 'primaryEmail', 'primaryContact']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Client assigned successfully",
      data: assignmentWithDetails
    });

  } catch (error) {
    console.error("Error in assignClient:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Assign Enrolled Client to Marketing Team
export const assignEnrolledClient = async (req, res) => {
  try {
    const { clientId, assignedToId, remarkText } = req.body;
    const userId = req.user?.id;

    console.log('Enrolled client assignment request:', { clientId, assignedToId, remarkText, userId });

    if (!clientId || !assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Client ID and Assigned To ID are required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Check if enrolled client exists
    const enrolledClient = await EnrolledClients.findByPk(clientId);
    if (!enrolledClient) {
      return res.status(404).json({
        success: false,
        message: `Enrolled client not found with ID: ${clientId}`
      });
    }

    // Check if assigned user exists and is a marketing team lead
    const assignedUser = await User.findOne({
      where: { id: assignedToId },
      include: [
        {
          model: Department,
          as: 'department',
          where: { isMarketingTeam: true },
          required: true
        }
      ]
    });

    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: `Marketing team lead not found with ID: ${assignedToId}`
      });
    }

    // Check if client is already assigned to the same user
    if (enrolledClient.assignTo === assignedToId) {
      return res.status(400).json({
        success: false,
        message: "Client is already assigned to this marketing team lead"
      });
    }

    // Update the enrolled client with new assignment
    const previousAssignedId = enrolledClient.assignTo;
    
    await enrolledClient.update({
      assignTo: assignedToId,
      updatedBy: userId
    });

    // Get existing assignment if any
    const existingAssignment = await ClientAssignment.findOne({
      where: { clientId, status: 'active' }
    });

    let assignment;
    if (existingAssignment) {
      // Update existing assignment
      const allPreviousAssignedIds = [...(existingAssignment.allPreviousAssignedIds || []), existingAssignment.assignedToId];

      // Get existing remarks and ensure they have all required fields
      const existingRemarks = (existingAssignment.remark || []).map(oldRemark => ({
        changedTo: {
          to: Number(oldRemark.changedTo?.to || 0),
          from: Number(oldRemark.changedTo?.from || 0)
        },
        text: oldRemark.text || '',
        timestamp: oldRemark.timestamp || oldRemark.createdAt || new Date().toISOString()
      }));

      // Create new remark for reassignment
      const newRemark = {
        changedTo: {
          to: Number(assignedToId),
          from: Number(existingAssignment.assignedToId)
        },
        text: remarkText || 'Client reassigned to marketing team',
        timestamp: new Date().toISOString()
      };
      
      const remark = [...existingRemarks, newRemark];

      await existingAssignment.update({
        assignedToId,
        previousAssignedId: existingAssignment.assignedToId,
        allPreviousAssignedIds,
        updatedBy: userId,
        remark,
        reassignedBy: userId
      });
      
      assignment = existingAssignment;
    } else {
      // Create new assignment
      const remark = [{
        changedTo: {
          to: Number(assignedToId),
          from: Number(previousAssignedId || 0)
        },
        text: remarkText || 'Client assigned to marketing team',
        timestamp: new Date().toISOString()
      }];

      assignment = await ClientAssignment.create({
        clientId,
        assignedToId,
        previousAssignedId,
        allPreviousAssignedIds: previousAssignedId ? [previousAssignedId] : [],
        createdBy: userId,
        status: 'active',
        remark,
        reassignedBy: null
      });
    }

    // Fetch assignment with details
    const assignmentWithDetails = await ClientAssignment.findByPk(assignment.id, {
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
          model: EnrolledClients,
          as: 'enrolledClient',
          attributes: ['id', 'lead_id', 'packageid', 'assignTo']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: existingAssignment ? "Enrolled client reassigned to marketing team successfully" : "Enrolled client assigned to marketing team successfully",
      data: assignmentWithDetails
    });

  } catch (error) {
    console.error("Error in assignEnrolledClient:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get Client Assignment
export const getClientAssignment = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const assignment = await ClientAssignment.findOne({
      where: { clientId, status: 'active' },
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
        },
        {
          model: EnrolledClients,
          as: 'client',
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active assignment found for this client"
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
    console.error("Error fetching client assignment:", error);
    handleError(error, res);
  }
};

// Get Enrolled Client Assignment
export const getEnrolledClientAssignment = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const assignment = await ClientAssignment.findOne({
      where: { clientId, status: 'active' },
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
          model: EnrolledClients,
          as: 'enrolledClient',
          attributes: ['id', 'lead_id', 'packageid', 'assignTo']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No active assignment found for this enrolled client"
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error("Error fetching enrolled client assignment:", error);
    handleError(error, res);
  }
};

// Get Client Assignment History
export const getClientAssignmentHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const assignments = await ClientAssignment.findAll({
      where: { clientId },
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
          model: EnrolledClients,
          as: 'client',
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error("Error fetching client assignment history:", error);
    handleError(error, res);
  }
};

// Get Marketing Team Leads
export const getMarketingTeamLeads = async (req, res) => {
  try {
    const teamLeads = await User.findAll({
      where: {
        status: 'active',
        role: 'user',  // assuming regular users, not admins
        subrole: 'Team Lead'
      },
      attributes: ['id', 'firstname', 'lastname', 'email', 'departmentId', 'status'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['departmentName', 'isMarketingTeam'],
          required: true, // This ensures INNER JOIN
          where: {
            isMarketingTeam: true
          }
        }
      ]
    });

    if (!teamLeads) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: teamLeads
    });
  } catch (error) {
    console.error("Error fetching marketing team leads:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
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
      message: "Invalid reference: Client or User not found"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}; 