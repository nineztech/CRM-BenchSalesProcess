import Lead from "../models/leadModel.js";
import { ValidationError, UniqueConstraintError } from "sequelize";

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