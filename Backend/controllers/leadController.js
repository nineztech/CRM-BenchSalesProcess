import Lead from "../models/leadModel.js";
import { ValidationError, UniqueConstraintError, Op } from "sequelize";
import User from "../models/userModel.js";

export const createLead = async (req, res) => {
  try {
    // Extract data from request body
    const {
      candidateName,
      contactNumber,
      email,
      linkedinId,
      technology,
      country,
      visaStatus,
      remarks,
      assignTo,
      status
    } = req.body;

    // Validate required fields
    const requiredFields = ['candidateName', 'contactNumber', 'email', 'technology', 'country', 'visaStatus'];
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
    if (status && !['open', 'converted', 'archive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        errors: [{
          field: 'status',
          message: 'Status must be one of: open, converted, archive'
        }]
      });
    }

    // Create lead data object
    const leadData = {
      candidateName: candidateName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim().toLowerCase(),
      technology: technology.trim(),
      country: country.trim(),
      visaStatus,
      status: status || 'open', // Default to 'open' if not provided
      remarks: remarks ? remarks.trim() : null
    };

    // Add optional fields if provided
    if (linkedinId && linkedinId.trim()) {
      leadData.linkedinId = linkedinId.trim();
    }

    // Handle assignment
    if (assignTo) {
      leadData.assignTo = assignTo;
      leadData.previousAssign = null; // Initially no previous assignment
      leadData.totalAssign = 1; // First assignment
    } else {
      leadData.assignTo = null;
      leadData.previousAssign = null;
      leadData.totalAssign = 0;
    }

    // Create the lead
    const newLead = await Lead.create(leadData);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        id: newLead.id,
        candidateName: newLead.candidateName,
        contactNumber: newLead.contactNumber,
        email: newLead.email,
        linkedinId: newLead.linkedinId,
        technology: newLead.technology,
        country: newLead.country,
        visaStatus: newLead.visaStatus,
        status: newLead.status,
        assignTo: newLead.assignTo,
        previousAssign: newLead.previousAssign,
        totalAssign: newLead.totalAssign,
        remarks: newLead.remarks,
        createdAt: newLead.createdAt,
        updatedAt: newLead.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creating lead:', error);

    // Handle Sequelize validation errors
    if (error instanceof ValidationError) {
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

    // Handle unique constraint errors (duplicate email)
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        message: 'Lead with this email already exists',
        errors: [{
          field: 'email',
          message: 'Email address is already registered'
        }]
      });
    }

    // Handle other errors
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