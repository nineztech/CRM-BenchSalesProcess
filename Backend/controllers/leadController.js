import Lead from "../models/leadModel.js";
import { ValidationError, UniqueConstraintError, Op } from "sequelize";
import User from "../models/userModel.js";

export const createLead = async (req, res) => {
  try {
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
      technology: technology.trim(),
      country: country.trim(),
      countryCode: countryCode.trim(),
      visaStatus,
      status: status || 'Numb',
      leadSource: leadSource.trim(),
      remarks: Array.isArray(remarks) ? remarks : remarks ? [remarks] : [],
      reference: reference ? reference.trim() : null
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

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: newLead
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
    if (status && ['open', 'converted', 'archive'].includes(status)) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { candidateName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
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
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previouslyAssignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(leads.count / parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Leads fetched successfully',
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
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching leads'
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
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previouslyAssignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
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
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previouslyAssignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
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

    // Update the lead
    await lead.update(updateData);

    // Fetch updated lead with associations
    const updatedLead = await Lead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'previouslyAssignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
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