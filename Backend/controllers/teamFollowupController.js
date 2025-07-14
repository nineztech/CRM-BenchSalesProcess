import TeamFollowup from "../models/teamFollowupModel.js";
import Lead from "../models/leadModel.js";
import User from "../models/userModel.js";
import { ValidationError, Op } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

// Create a new team followup
export const createTeamFollowup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { leadId, assignedToId, remark } = req.body;
    console.log('Received request:', { leadId, assignedToId, remark });

    // Validate required fields
    if (!leadId || !assignedToId || !remark) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if there's already a team followup for this lead
    const existingFollowup = await TeamFollowup.findOne({
      where: { leadId },
      transaction
    });

    if (existingFollowup) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A team followup already exists for this lead'
      });
    }

    // Find the lead first to get its current remarks
    const lead = await Lead.findByPk(leadId, { transaction });
    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    console.log('Found lead:', lead.id);

    // Get the assigned user details
    const assignedUser = await User.findByPk(assignedToId, {
      attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
      transaction
    });

    if (!assignedUser) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found'
      });
    }
    console.log('Found assigned user:', assignedUser.id);

    // Get all existing lead remarks
    const leadRemarks = Array.isArray(lead.remarks) ? lead.remarks : [];

    // Filter out any existing team followup remarks from lead history
    const filteredLeadRemarks = leadRemarks.filter(remark => 
      !remark.text.startsWith('Team Followup:')
    );

    // Create new remark with consistent structure
    const newRemark = {
      text: remark,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      creator: {
        id: req.user.id,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        email: req.user.email,
        subrole: req.user.subrole,
        departmentId: req.user.departmentId
      },
      statusChange: {
        from: lead.status,
        to: 'teamfollowup'
      }
    };

    // Create team followup with filtered lead remarks and new remark
    const teamFollowupData = {
      leadId,
      assignedById: req.user.id,
      assignedToId,
      status: 'teamfollowup',
      remarks: [...filteredLeadRemarks, newRemark]
    };
    console.log('Creating team followup with data:', teamFollowupData);

    const teamFollowup = await TeamFollowup.create(teamFollowupData, { transaction });
    console.log('Team followup created:', teamFollowup.id);

    // Update lead with new remark at the end of remarks array
    const leadUpdateData = {
      status: 'teamfollowup',
      remarks: [...leadRemarks, {
        ...newRemark,
        text: `Team Followup: ${remark}` // Prefix the remark in lead's history
      }],
      updatedBy: req.user.id
    };
    console.log('Updating lead with data:', leadUpdateData);

    await lead.update(leadUpdateData, { transaction });
    console.log('Lead updated successfully');

    // Commit the transaction
    await transaction.commit();
    console.log('Transaction committed successfully');

    // Fetch the created team followup with associations to return in response
    const createdTeamFollowup = await TeamFollowup.findByPk(teamFollowup.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Team followup created successfully',
      data: createdTeamFollowup
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating team followup:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });

    return res.status(500).json({
      success: false,
      message: 'Error creating team followup',
      error: {
        message: error.message,
        sql: error.sql,
        parameters: error.parameters
      }
    });
  }
};

// Update team followup status
export const updateTeamFollowupStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, remark, followUpDate, followUpTime } = req.body;

    // Validate required fields
    if (!status || !remark) {
      return res.status(400).json({
        success: false,
        message: 'Status and remark are required'
      });
    }

    const teamFollowup = await TeamFollowup.findByPk(id, { transaction });
    if (!teamFollowup) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Team followup not found'
      });
    }

    // Get the associated lead
    const lead = await Lead.findByPk(teamFollowup.leadId, { transaction });
    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Associated lead not found'
      });
    }

    // Create new remark with consistent structure
    const newRemark = {
      text: remark,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      creator: {
        id: req.user.id,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        email: req.user.email,
        subrole: req.user.subrole,
        departmentId: req.user.departmentId
      },
      statusChange: {
        from: teamFollowup.status,
        to: status
      }
    };

    // Get existing remarks and filter out team followup remarks
    const existingRemarks = Array.isArray(teamFollowup.remarks) ? teamFollowup.remarks : [];
    const filteredRemarks = existingRemarks.filter(remark => 
      !remark.text.startsWith('Team Followup:')
    );

    // Update the team followup
    const updateData = {
      status,
      remarks: [...filteredRemarks, newRemark]
    };

    // Add follow-up date and time if provided
    if (followUpDate && followUpTime) {
      updateData.followUpDate = followUpDate;
      updateData.followUpTime = followUpTime;
      updateData.followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
    }

    await teamFollowup.update(updateData, { transaction });

    // Update lead remarks
    const leadRemarks = Array.isArray(lead.remarks) ? lead.remarks : [];
    await lead.update({
      remarks: [...leadRemarks, {
        ...newRemark,
        text: `Team Followup: ${remark}`
      }],
      updatedBy: req.user.id
    }, { transaction });

    await transaction.commit();

    // Fetch updated team followup with associations
    const updatedTeamFollowup = await TeamFollowup.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Team followup status updated successfully',
      data: updatedTeamFollowup
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating team followup status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating team followup status',
      error: error.message
    });
  }
};

// Get team followups assigned to logged-in user
export const getAssignedTeamFollowups = async (req, res) => {
  try {
    const teamFollowups = await TeamFollowup.findAll({
      where: {
        assignedToId: req.user.id
      },
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['firstName', 'lastName', 'primaryEmail', 'primaryContact']
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: teamFollowups
    });
  } catch (error) {
    console.error('Error fetching assigned team followups:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching assigned team followups',
      error: error.message
    });
  }
};

// Get all team followups
export const getTeamFollowups = async (req, res) => {
  try {
    const { status, assignedToId } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const teamFollowups = await TeamFollowup.findAll({
      where,
      include: [
        {
          model: Lead,
          as: 'lead',
          // Include all lead attributes
          attributes: {
            exclude: ['createdAt', 'updatedAt'] // Exclude only timestamp fields
          },
          include: [
            {
              model: User,
              as: 'assignedUser',
              attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
            },
            {
              model: User,
              as: 'previouslyAssignedUser',
              attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
            },
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
            },
            {
              model: User,
              as: 'updater',
              attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
            }
          ]
        },
        {
          model: User,
          as: 'assignedBy',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: teamFollowups
    });
  } catch (error) {
    console.error('Error fetching team followups:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching team followups',
      error: error.message
    });
  }
}; 