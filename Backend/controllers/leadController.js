import Lead from "../models/leadModel.js";
import { ValidationError, UniqueConstraintError, Op } from "sequelize";
import User from "../models/userModel.js";
import ArchivedLead from "../models/archivedLeadModel.js";
import { sequelize } from "../config/dbConnection.js";

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
        'Numb',
        'not working',
        'wrong no',
        'closed',
        'call again later'
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
// Get All Leads with filtering and pagination
export const getAllLeads = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build where clause
    const whereClause = {};
    
    // Add status filter if provided
    if (status) {
      // Define status mappings for status groups
      const statusMappings = {
        open: ['open', 'Numb'],
        converted: ['closed'],
        archived: ['Dead', 'notinterested'],
        inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'wrong no', 'call again later']
      };

      // If status is a status group, map it to actual status values
      if (statusMappings[status]) {
        whereClause.status = { [Op.in]: statusMappings[status] };
      } else {
        // If it's a direct status value, use it as is
        whereClause.status = status;
      }
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { emails: { [Op.like]: `%${search}%` } },
        { technology: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get leads with pagination
    const leads = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false  // Make this a LEFT JOIN
        },
        {
          model: User,
          as: 'previouslyAssignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false  // Make this a LEFT JOIN
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset
    });

    // Process the leads to ensure assignment data is accurate
    const processedLeads = leads.rows.map(lead => {
      const leadData = lead.toJSON();
      // Only include assignment data if there's actually an assigned user
      if (!leadData.assignedUser) {
        leadData.assignedUser = null;
        leadData.assignTo = null;
      }
      if (!leadData.previouslyAssignedUser) {
        leadData.previouslyAssignedUser = null;
        leadData.previousAssign = null;
      }
      return leadData;
    });

    return res.status(200).json({
      success: true,
      message: 'Leads fetched successfully',
      data: {
        leads: processedLeads,
        pagination: {
          total: leads.count,
          totalPages: Math.ceil(leads.count / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching leads'
    });
  }
};

// Get Leads Assigned to Logged-in User
export const getAssignedLeads = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

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

    // Build where clause
    const whereClause = {
      [Op.or]: [
        { assignTo: req.user.id },  // Leads assigned to the user
        { createdBy: req.user.id }  // Leads created by the user
      ]
    };
    
    // Add status filter if provided
    if (status && ['open', 'converted', 'archive'].includes(status)) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { emails: { [Op.like]: `%${search}%` } },
        { technology: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get leads with pagination
    const leads = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false
        },
        {
          model: User,
          as: 'previouslyAssignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstname', 'lastname', 'email', 'subrole', 'departmentId'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset
    });

    // Process the leads to ensure assignment data is accurate
    const processedLeads = leads.rows.map(lead => {
      const leadData = lead.toJSON();
      if (!leadData.assignedUser) {
        leadData.assignedUser = null;
        leadData.assignTo = null;
      }
      if (!leadData.previouslyAssignedUser) {
        leadData.previouslyAssignedUser = null;
        leadData.previousAssign = null;
      }
      return leadData;
    });

    return res.status(200).json({
      success: true,
      message: 'Assigned leads fetched successfully',
      data: {
        leads: processedLeads,
        pagination: {
          total: leads.count,
          totalPages: Math.ceil(leads.count / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching assigned leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching assigned leads'
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
    const validStatusGroups = ['open', 'converted', 'archived', 'inProcess', 'followUp'];
    if (!validStatusGroups.includes(statusGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status group parameter'
      });
    }

    // Define status mappings
    const statusMappings = {
      open: ['open', 'Numb'],
      converted: ['closed'],
      archived: ['Dead', 'notinterested'],
      inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'wrong no', 'call again later'],
      followUp: ['follow-up']
    };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};

    if (statusGroup === 'followUp') {
      // Get current time
      const now = new Date();
      // Get time 24 hours from now
      const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

      whereClause = {
        [Op.or]: [
          // Case 1: Follow-up date is within next 24 hours
          {
            status: 'follow-up',
            followUpDate: {
              [Op.not]: null
            },
            [Op.and]: sequelize.literal(`
              CONCAT(followUpDate, ' ', followUpTime) <= '${twentyFourHoursFromNow.toISOString()}'
              AND CONCAT(followUpDate, ' ', followUpTime) >= '${now.toISOString()}'
            `)
          },
          // Case 2: Follow-up date has passed and status hasn't been updated
          {
            status: 'follow-up',
            followUpDate: {
              [Op.not]: null
            },
            [Op.and]: sequelize.literal(`
              CONCAT(followUpDate, ' ', followUpTime) < '${now.toISOString()}'
            `)
          }
        ]
      };
    } else {
      whereClause = {
        status: {
          [Op.in]: statusMappings[statusGroup]
        }
      };

      // For inProcess, include leads that are follow-up but more than 24 hours away
      if (statusGroup === 'inProcess') {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

        whereClause = {
          [Op.or]: [
            // Original inProcess statuses
            {
              status: {
                [Op.in]: statusMappings[statusGroup]
              }
            },
            // Follow-up leads with dates more than 24 hours away
            {
              status: 'follow-up',
              followUpDate: {
                [Op.not]: null
              },
              [Op.and]: sequelize.literal(`
                CONCAT(followUpDate, ' ', followUpTime) > '${twentyFourHoursFromNow.toISOString()}'
              `)
            }
          ]
        };
      }
    }

    const leads = await Lead.findAndCountAll({
      where: whereClause,
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
      'follow-up'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Validate follow-up date and time if status is follow-up
    if (status === 'follow-up') {
      if (!followUpDate || !followUpTime) {
        return res.status(400).json({
          success: false,
          message: 'Follow-up date and time are required when status is follow-up',
          errors: [
            !followUpDate && { field: 'followUpDate', message: 'Follow-up date is required' },
            !followUpTime && { field: 'followUpTime', message: 'Follow-up time is required' }
          ].filter(Boolean)
        });
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up date format. Use YYYY-MM-DD',
          errors: [{ field: 'followUpDate', message: 'Invalid date format' }]
        });
      }

      // Validate time format (HH:mm or HH:mm:ss)
      if (!/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(followUpTime)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up time format. Use HH:mm or HH:mm:ss',
          errors: [{ field: 'followUpTime', message: 'Invalid time format' }]
        });
      }

      // Validate that follow-up date/time is in the future
      const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
      if (followUpDateTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Follow-up date and time must be in the future',
          errors: [{ field: 'followUpDate', message: 'Must be a future date and time' }]
        });
      }
    }

    // Find the lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
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

    // Add follow-up details to remark if status is follow-up
    if (status === 'follow-up') {
      remarkObject.followUp = {
        date: followUpDate,
        time: followUpTime
      };
    }

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

      // Remove fields that shouldn't be copied
      delete archivedLeadData.id;

      // Create archived lead and delete original lead
      await ArchivedLead.create(archivedLeadData, { transaction });
      await lead.destroy({ transaction });

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Lead archived successfully',
        data: archivedLeadData
      });
    }

    // If not archiving, update the status, remarks, and follow-up details
    const updateData = {
      status,
      remarks: updatedRemarks,
      updatedBy: req.user.id,
      followUpDate: status === 'follow-up' ? followUpDate : null,
      followUpTime: status === 'follow-up' ? followUpTime : null
    };

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