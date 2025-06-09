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
      remarks
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

    // Create lead data object
    const leadData = {
      candidateName: candidateName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim().toLowerCase(),
      technology: technology.trim(),
      country: country.trim(),
      visaStatus,
      remarks: remarks ? remarks.trim() : null
    };

    // Add linkedinId if provided
    if (linkedinId && linkedinId.trim()) {
      leadData.linkedinId = linkedinId.trim();
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
