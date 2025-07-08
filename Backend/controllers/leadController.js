import Lead from "../models/leadModel.js";
import { ValidationError, UniqueConstraintError, Op } from "sequelize";
import User from "../models/userModel.js";
import ArchivedLead from "../models/archivedLeadModel.js";
import { sequelize } from "../config/dbConnection.js";
import { Sequelize } from "sequelize";

export const createLead = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: [{
          field: 'authentication',
          message: 'User must be authenticated to create a lead'
        }]
      });
    }

    // Verify that the user exists
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user',
        errors: [{
          field: 'authentication',
          message: 'User not found'
        }]
      });
    }

    // Extract data from request body
    const {
      firstName,
      lastName,
      contactNumbers,
      emails,
      linkedinId,
      technology,
      country,
      countryCode,
      visaStatus,
      remarks,
      assignTo,
      status,
      leadSource,
      reference
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'contactNumbers',
      'emails',
      'technology',
      'country',
      'countryCode',
      'visaStatus',
      'leadSource'
    ];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        errors: missingFields.map(field => ({
          field,
          message: `${field} is required`
        }))
      });
    }

    // Validate contact numbers and emails
    if (!Array.isArray(contactNumbers) || contactNumbers.length === 0 || contactNumbers.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact numbers',
        errors: [{
          field: 'contactNumbers',
          message: 'Must provide 1-2 contact numbers'
        }]
      });
    }

    if (!Array.isArray(emails) || emails.length === 0 || emails.length > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emails',
        errors: [{
          field: 'emails',
          message: 'Must provide 1-2 email addresses'
        }]
      });
    }

    // Check if primary email already exists
    const primaryEmail = emails[0].toLowerCase();
    const existingLead = await Lead.findOne({
      where: { primaryEmail }
    });

    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: 'Lead with this primary email already exists',
        errors: [{
          field: 'emails',
          message: 'Primary email address is already registered'
        }]
      });
    }

    // Validate visa status enum
    const validVisaStatuses = ['H1B', 'L1', 'F1', 'Green Card', 'Citizen', 'H4 EAD', 'L2 EAD', 'Other'];
    if (!validVisaStatuses.includes(visaStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visa status',
        errors: [{
          field: 'visaStatus',
          message: `Visa status must be one of: ${validVisaStatuses.join(', ')}`
        }]
      });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = [
        'interested',
        'notinterested',
        'DNR1',
        'DNR2',
        'DNR3',
        'Dead',
        'open',
        'not working',
        'wrong no',
        'closed',
        'call again later',
        'follow up'
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          errors: [{
            field: 'status',
            message: `Status must be one of: ${validStatuses.join(', ')}`
          }]
        });
      }
    }

    // Create lead data object
    const leadData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactNumbers,
      emails: emails.map(email => email.toLowerCase()),
      primaryEmail, // This will be set automatically by the beforeValidate hook
      technology: Array.isArray(technology) ? technology.map(tech => tech.trim()) : [technology.trim()],
      country: country.trim(),
      countryCode: countryCode.trim(),
      visaStatus,
      status: 'open', // Set default status to 'open'
      leadSource: leadSource.trim(),
      remarks: [], // Initialize empty remarks array
      reference: reference ? reference.trim() : null,
      createdBy: req.user.id, // Add the user who created the lead
      updatedBy: null  // Initially null, will be set on update
    };

    // Add optional fields if provided
    if (linkedinId && linkedinId.trim()) {
      leadData.linkedinId = linkedinId.trim();
    }

    // Handle assignment
    if (assignTo) {
      leadData.assignTo = assignTo;
      leadData.previousAssign = null;
      leadData.totalAssign = 1;
    }

    // Create the lead
    const newLead = await Lead.create(leadData);

    // If there are initial remarks, add them with creator details
    if (remarks && Array.isArray(remarks) && remarks.length > 0) {
      const creator = await User.findByPk(req.user.id, {
        attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
      });

      if (creator) {
        const formattedRemarks = remarks.map(remark => ({
          text: typeof remark === 'string' ? remark.trim() : (remark.text || '').trim(),
          createdAt: new Date().toISOString(),
          createdBy: creator.id,
          creator: {
            id: creator.id,
            firstname: creator.firstname,
            lastname: creator.lastname,
            email: creator.email,
            subrole: creator.subrole,
            departmentId: creator.departmentId
          },
          statusChange: {
            to: 'open'
          }
        })).filter(remark => remark.text); // Only keep remarks with non-empty text

        await newLead.update({ remarks: formattedRemarks });
      }
    }

    // Fetch the created lead with associations to get full user details
    const leadWithAssociations = await Lead.findByPk(newLead.id, {
      include: [
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
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: leadWithAssociations
    });

  } catch (error) {
    console.error('Error creating lead:', error);

    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Lead with this email already exists',
        errors: [{
          field: 'emails',
          message: 'Primary email address is already registered'
        }]
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while creating lead',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Leads with filtering and pagination
export const getAllLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Define status mappings
    const statusGroups = {
      open: ['open'],
      converted: ['closed'],
      archived: ['Dead', 'notinterested'],
      inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'wrong no', 'call again later']
    };

    // First get all leads that have follow-up dates
    const now = new Date();
    const followupLeads = await Lead.findAndCountAll({
      where: {
        followUpDate: {
          [Op.not]: null
        },
        followUpTime: {
          [Op.not]: null
        },
        [Op.and]: [
          Sequelize.literal(`CONCAT(followUpDate, 'T', followUpTime) > NOW()`),
          Sequelize.literal(`CONCAT(followUpDate, 'T', followUpTime) <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`)
        ]
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
      ],
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: limit
    });

    // Get the IDs of follow-up leads to exclude from other queries
    const followupLeadIds = followupLeads.rows.map(lead => lead.id);

    // Function to get leads for a specific status group with pagination
    const getLeadsForStatus = async (statuses) => {
      const { count, rows } = await Lead.findAndCountAll({
        where: {
          status: {
            [Op.in]: statuses
          },
          id: {
            [Op.notIn]: followupLeadIds // Exclude leads that are in follow-up
          }
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
        ],
        order: [[sortBy, sortOrder]],
        offset: offset,
        limit: limit
      });

      return {
        leads: rows,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          limit: limit
        }
      };
    };

    // Get leads for each status group
    const [openLeads, inProcessLeads, convertedLeads, archivedLeads] = await Promise.all([
      getLeadsForStatus(statusGroups.open),
      getLeadsForStatus(statusGroups.inProcess),
      getLeadsForStatus(statusGroups.converted),
      getLeadsForStatus(statusGroups.archived)
    ]);

    const response = {
      success: true,
      data: {
        open: openLeads,
        inProcess: inProcessLeads,
        converted: convertedLeads,
        archived: archivedLeads,
        followup: {
          leads: followupLeads.rows,
          pagination: {
            total: followupLeads.count,
            totalPages: Math.ceil(followupLeads.count / limit),
            currentPage: page,
            limit: limit
          }
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getAllLeads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
};

// Get Leads Assigned to Logged-in User
export const getAssignedLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: [{
          field: 'authentication',
          message: 'User must be authenticated to view assigned leads'
        }]
      });
    }

    // Define status mappings
    const statusGroups = {
      open: ['open'],
      converted: ['closed'],
      archived: ['Dead', 'notinterested'],
      inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'wrong no', 'call again later']
    };

    // First get all leads that have follow-up dates
    const now = new Date();
    const followupLeads = await Lead.findAndCountAll({
      where: {
        [Op.or]: [
          { assignTo: req.user.id },
          { createdBy: req.user.id }
        ],
        followUpDate: {
          [Op.not]: null
        },
        followUpTime: {
          [Op.not]: null
        },
        [Op.and]: [
          Sequelize.literal(`CONCAT(followUpDate, 'T', followUpTime) > NOW()`),
          Sequelize.literal(`CONCAT(followUpDate, 'T', followUpTime) <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`)
        ]
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
      ],
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: limit
    });

    // Get the IDs of follow-up leads to exclude from other queries
    const followupLeadIds = followupLeads.rows.map(lead => lead.id);

    // Function to get leads for a specific status group with pagination
    const getLeadsForStatus = async (statuses) => {
      const { count, rows } = await Lead.findAndCountAll({
        where: {
          [Op.and]: [
            {
              status: {
                [Op.in]: statuses
              }
            },
            {
              id: {
                [Op.notIn]: followupLeadIds
              }
            },
            {
              [Op.or]: [
                { assignTo: req.user.id },
                { createdBy: req.user.id }
              ]
            }
          ]
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
        ],
        order: [[sortBy, sortOrder]],
        offset: offset,
        limit: limit
      });

      return {
        leads: rows,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          limit: limit
        }
      };
    };

    // Get leads for each status group
    const [openLeads, inProcessLeads, convertedLeads, archivedLeads] = await Promise.all([
      getLeadsForStatus(statusGroups.open),
      getLeadsForStatus(statusGroups.inProcess),
      getLeadsForStatus(statusGroups.converted),
      getLeadsForStatus(statusGroups.archived)
    ]);

    const response = {
      success: true,
      data: {
        open: openLeads,
        inProcess: inProcessLeads,
        converted: convertedLeads,
        archived: archivedLeads,
        followup: {
          leads: followupLeads.rows,
          pagination: {
            total: followupLeads.count,
            totalPages: Math.ceil(followupLeads.count / limit),
            currentPage: page,
            limit: limit
          }
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching assigned leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching assigned leads',
      error: error.message
    });
  }
};

// Get Leads by Status
export const getLeadsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate status
    if (!['open', 'converted', 'archive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status parameter'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const leads = await Lead.findAndCountAll({
      where: { status },
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
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(leads.count / parseInt(limit));

    return res.status(200).json({
      success: true,
      message: `Leads with status '${status}' fetched successfully`,
      data: {
        leads: leads.rows,
        pagination: {
          total: leads.count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leads by status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching leads'
    });
  }
};

// Get Leads by Status Group
export const getLeadsByStatusGroup = async (req, res) => {
  try {
    const { statusGroup } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate status group
    const validStatusGroups = ['open', 'converted', 'archived', 'inProcess'];
    if (!validStatusGroups.includes(statusGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status group parameter'
      });
    }

    // Define status mappings
    const statusMappings = {
      open: ['Numb'],
      converted: ['closed'],
      archived: ['Dead', 'notinterested'],
      inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'wrong no', 'call again later']
    };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const leads = await Lead.findAndCountAll({
      where: {
        status: {
          [Op.in]: statusMappings[statusGroup]
        }
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
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(leads.count / parseInt(limit));

    return res.status(200).json({
      success: true,
      message: `Leads in status group '${statusGroup}' fetched successfully`,
      data: {
        leads: leads.rows,
        pagination: {
          total: leads.count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leads by status group:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching leads'
    });
  }
};

// Update Lead
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Handle technology array if provided
    if (updateData.technology) {
      updateData.technology = Array.isArray(updateData.technology) 
        ? updateData.technology.map(tech => tech.trim())
        : [updateData.technology.trim()];
    }

    // Validate status if provided
    if (updateData.status && !['open', 'converted', 'archive'].includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Handle assignment changes
    if (updateData.assignTo && updateData.assignTo !== lead.assignTo) {
      updateData.previousAssign = lead.assignTo;
      updateData.totalAssign = (lead.totalAssign || 0) + 1;
    }

    // Add updatedBy field
    updateData.updatedBy = req.user.id;

    // Update the lead
    await lead.update(updateData);

    // Fetch updated lead with associations
    const updatedLead = await Lead.findByPk(id, {
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
    });

    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead
    });

  } catch (error) {
    console.error('Error updating lead:', error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while updating lead'
    });
  }
};

// Update Lead Status
export const updateLeadStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, remark, followUpDate, followUpTime } = req.body;

    // Validate status
    const validStatuses = [
      'interested',
      'notinterested',
      'DNR1',
      'DNR2',
      'DNR3',
      'Dead',
      'open',
      'not working',
      'wrong no',
      'closed',
      'call again later',
      'follow up'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Validate remark
    if (!remark || typeof remark !== 'string' || !remark.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Remark is required for status change'
      });
    }

    // Find the lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Validate follow-up date and time for inProcess statuses
    const inProcessStatuses = ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later'];
    if (inProcessStatuses.includes(status)) {
      if (!followUpDate || !followUpTime) {
        return res.status(400).json({
          success: false,
          message: 'Follow-up date and time are required for in-process status changes'
        });
      }

      // Validate that follow-up time is in the future
      const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
      const now = new Date();
      if (followUpDateTime <= now) {
        return res.status(400).json({
          success: false,
          message: 'Follow-up date and time must be in the future'
        });
      }
    }

    // Get creator details
    const creator = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId']
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // Parse the remark if it's a string
    let remarkData;
    try {
      remarkData = typeof remark === 'string' ? JSON.parse(remark) : remark;
    } catch (e) {
      remarkData = { text: remark };
    }

    // Create remark object with metadata and creator details
    const remarkObject = {
      text: remarkData.text || remarkData.trim(),
      createdAt: new Date().toISOString(),
      createdBy: creator.id,
      creator: {
        id: creator.id,
        firstname: creator.firstname,
        lastname: creator.lastname,
        email: creator.email,
        subrole: creator.subrole,
        departmentId: creator.departmentId
      },
      statusChange: {
        from: lead.status,
        to: status
      }
    };

    // Get current remarks array and append new remark
    const currentRemarks = Array.isArray(lead.remarks) ? lead.remarks : [];
    const updatedRemarks = [...currentRemarks, remarkObject];

    // Check if the lead should be archived
    const archiveStatuses = ['Dead', 'notinterested'];
    if (archiveStatuses.includes(status)) {
      // Create archived lead
      const archivedLeadData = {
        ...lead.toJSON(),
        originalLeadId: lead.id,
        archiveReason: status,
        status: 'inactive',
        archivedAt: new Date(),
        remarks: updatedRemarks,
        updatedBy: req.user.id,
        archivedBy: req.user.id
      };

      delete archivedLeadData.id;

      await ArchivedLead.create(archivedLeadData, { transaction });
      await lead.destroy({ transaction });

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Lead archived successfully',
        data: archivedLeadData
      });
    }

    // Prepare update data
    const updateData = {
      status,
      remarks: updatedRemarks,
      updatedBy: req.user.id,
      followUpDate: null,
      followUpTime: null,
      followUpDateTime: null
    };

    // Add follow-up data if provided
    if (followUpDate && followUpTime) {
      try {
        // Ensure proper date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (!dateRegex.test(followUpDate) || !timeRegex.test(followUpTime)) {
          throw new Error('Invalid date or time format');
        }

        // Format the time to ensure HH:mm:ss format
        const [hours, minutes] = followUpTime.split(':');
        const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
        
        // Create the datetime string in MySQL format
        const mysqlDateTime = `${followUpDate} ${formattedTime}`;
        const followUpDateTimeObj = new Date(mysqlDateTime);

        // Validate the created date
        if (isNaN(followUpDateTimeObj.getTime())) {
          throw new Error('Invalid date/time combination');
        }

        updateData.followUpDate = followUpDate;
        updateData.followUpTime = formattedTime;
        updateData.followUpDateTime = followUpDateTimeObj;
      } catch (error) {
        console.error('Error formatting follow-up date/time:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up date or time format',
          error: error.message
        });
      }
    }

    // Update the lead with the prepared data
    await lead.update(updateData, { transaction });

    await transaction.commit();

    // Fetch updated lead with associations
    const updatedLead = await Lead.findByPk(id, {
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
    });

    return res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: updatedLead
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating lead status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while updating lead status'
    });
  }
};

// Archive lead
export const archiveLead = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { archiveReason } = req.body;

    // Find the lead to archive
    const lead = await Lead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
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
      ],
      transaction
    });

    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Parse the archive reason if it's a string
    let archiveReasonData;
    try {
      archiveReasonData = typeof archiveReason === 'string' ? JSON.parse(archiveReason) : archiveReason;
    } catch (e) {
      archiveReasonData = { text: archiveReason };
    }

    // Extract the text from the archive reason data
    const archiveReasonText = archiveReasonData.text || archiveReasonData;

    // Add the archive action to remarks
    const remarks = lead.remarks || [];
    remarks.push({
      text: `Lead archived: ${archiveReasonText}`,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      statusChange: {
        from: lead.status || 'open',
        to: 'archived'
      }
    });

    // Create archived lead record
    const archivedLead = await ArchivedLead.create({
      ...lead.toJSON(),
      originalLeadId: lead.id,
      archiveReason: archiveReasonText,
      archivedAt: new Date(),
      status: 'active',
      archivedBy: req.user.id,
      remarks
    }, { transaction });

    // Delete the original lead
    await lead.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Lead archived successfully',
      data: archivedLead
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error archiving lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while archiving lead'
    });
  }
};