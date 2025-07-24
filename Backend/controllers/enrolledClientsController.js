import EnrolledClients from '../models/enrolledClientsModel.js';
import Lead from '../models/leadModel.js';
import User from '../models/userModel.js';
import Packages from '../models/packagesModel.js';
import { Op, Sequelize } from 'sequelize';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import express from 'express';
import { createClientUser } from './clientUserController.js';
import Installments from '../models/installmentsModel.js'; // Added import for Installments
const unlinkAsync = promisify(fs.unlink);

// Create enrolled client (automatically called when lead status changes to enrolled)
export const createEnrolledClient = async (req, res) => {
  try {
    const { lead_id, createdBy } = req.body;

    // Check if lead exists and has enrolled status
    const lead = await Lead.findByPk(lead_id);
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lead not found' 
      });
    }

    if (lead.status !== 'Enrolled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Lead must have enrolled status' 
      });
    }

    // Check if enrolled client already exists for this lead
    const existingEnrolledClient = await EnrolledClients.findOne({
      where: { lead_id }
    });

    if (existingEnrolledClient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Enrolled client already exists for this lead' 
      });
    }

    // Create enrolled client with only lead_id
    const enrolledClient = await EnrolledClients.create({
      lead_id,
      createdBy: createdBy || null
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled client created successfully',
      data: enrolledClient
    });

  } catch (error) {
    console.error('Error creating enrolled client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all enrolled clients
export const getAllEnrolledClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sales_person_id, admin_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (status) {
      if (status === 'pending_sales') {
        whereClause = { Approval_by_sales: false, has_update: false };
      } else if (status === 'pending_admin') {
        whereClause = { 
          Approval_by_admin: false, 
          has_update: false,
          packageid: { [Op.ne]: null }
        };
      } else if (status === 'pending_sales_review') {
        whereClause = { 
          has_update: true, 
          Approval_by_admin: false 
        };
      } else if (status === 'approved') {
        whereClause = { Approval_by_sales: true, Approval_by_admin: true };
      }
    }

    if (sales_person_id) {
      whereClause.Sales_person_id = sales_person_id;
    }

    if (admin_id) {
      whereClause.Admin_id = admin_id;
    }

    const enrolledClients = await EnrolledClients.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status']
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: Packages,
          as: 'package',
          attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice', 'features']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Enrolled clients retrieved successfully',
      data: enrolledClients.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(enrolledClients.count / limit),
        totalItems: enrolledClients.count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching enrolled clients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get enrolled client by ID
export const getEnrolledClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const enrolledClient = await EnrolledClients.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status', 'technology', 'country', 'visaStatus']
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: Packages,
          as: 'package',
          attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice', 'features']
        }
      ]
    });

    if (!enrolledClient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrolled client not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrolled client retrieved successfully',
      data: enrolledClient
    });

  } catch (error) {
    console.error('Error fetching enrolled client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Update enrolled client by sales person
export const updateEnrolledClientBySales = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      packageid, 
      payable_enrollment_charge, 
      payable_offer_letter_charge, 
      payable_first_year_percentage, 
      payable_first_year_fixed_charge,
      Sales_person_id,
      updatedBy 
    } = req.body;

    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrolled client not found' 
      });
    }

    // Validation: Only one of percentage or fixed charge should be provided
    if (payable_first_year_percentage && payable_first_year_fixed_charge) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot set both payable_first_year_percentage and payable_first_year_fixed_charge' 
      });
    }

    // Update the enrolled client
    await enrolledClient.update({
      packageid,
      payable_enrollment_charge,
      payable_offer_letter_charge,
      payable_first_year_percentage,
      payable_first_year_fixed_charge,
      Sales_person_id,
      updatedBy,
      Approval_by_sales: false,
      Approval_by_admin: false,
      has_update: false
    });

    res.status(200).json({
      success: true,
      message: 'Enrolled client updated successfully by sales person',
      data: enrolledClient
    });

  } catch (error) {
    console.error('Error updating enrolled client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Admin approval/rejection
export const adminApprovalAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      approved, 
      Admin_id, 
      edited_enrollment_charge, 
      edited_offer_letter_charge, 
      edited_first_year_percentage, 
      edited_first_year_fixed_charge,
      updatedBy 
    } = req.body;

    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrolled client not found' 
      });
    }

    if (approved) {
      // Admin approves without changes
      await enrolledClient.update({
        Approval_by_admin: true,
        Admin_id,
        has_update: false,
        updatedBy,
        edited_enrollment_charge: enrolledClient.payable_enrollment_charge,
        edited_offer_letter_charge: enrolledClient.payable_offer_letter_charge,
        edited_first_year_percentage: enrolledClient.payable_first_year_percentage,
        edited_first_year_fixed_charge: enrolledClient.payable_first_year_fixed_charge
      });

      // --- NEW LOGIC: Update all related installments' edit fields ---
      const allInstallments = await Installments.findAll({
        where: { enrolledClientId: id }
      });
      for (const inst of allInstallments) {
        await inst.update({
          edited_amount: inst.amount,
          edited_dueDate: inst.dueDate,
          edited_remark: inst.remark,
          has_admin_update: false
        });
      }
      // --- END NEW LOGIC ---

      // If both admin and sales have approved, mark initial payment as paid
      if (enrolledClient.Approval_by_sales && !enrolledClient.clientUserCreated) {
        // Find and update initial payment
        const initialPayment = await Installments.findOne({
          where: {
            enrolledClientId: id,
            installment_number: 0,
            is_initial_payment: true
          }
        });

        if (initialPayment) {
          await initialPayment.update({
            paid: true,
            paidDate: new Date()
          });
        }

        // Create client user only if not already created
        try {
          const { clientUser, plainPassword } = await createClientUser(id);
          console.log('Client user created successfully:', {
            username: clientUser.username,
            password: plainPassword
          });
          // Optionally, set a flag on enrolledClient to prevent future creation attempts
          await enrolledClient.update({ clientUserCreated: true });
        } catch (error) {
          if (error.message === 'Client user already exists') {
            // Do nothing, user already exists
          } else {
            console.error('Error creating client user:', error);
          }
        }
      }
      // Auto-approval by sales will be handled in the beforeUpdate hook
    } else {
      // Admin rejects/updates with changes
      const updateData = {
        Approval_by_admin: false,
        Admin_id,
        has_update: true,
        updatedBy
      };

      // Add edited fields if provided
      if (edited_enrollment_charge !== undefined) {
        updateData.edited_enrollment_charge = edited_enrollment_charge;
      }
      if (edited_offer_letter_charge !== undefined) {
        updateData.edited_offer_letter_charge = edited_offer_letter_charge;
      }
      if (edited_first_year_percentage !== undefined) {
        updateData.edited_first_year_percentage = edited_first_year_percentage;
      }
      if (edited_first_year_fixed_charge !== undefined) {
        updateData.edited_first_year_fixed_charge = edited_first_year_fixed_charge;
      }

      // Validation: Only one of percentage or fixed charge should be provided
      if (edited_first_year_percentage && edited_first_year_fixed_charge) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot set both edited_first_year_percentage and edited_first_year_fixed_charge' 
        });
      }

      await enrolledClient.update(updateData);
    }

    res.status(200).json({
      success: true,
      message: approved ? 'Enrolled client approved by admin' : 'Enrolled client updated by admin',
      data: enrolledClient
    });

  } catch (error) {
    console.error('Error in admin approval action:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Sales approval/rejection for admin changes
export const salesApprovalAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, updatedBy } = req.body;

    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrolled client not found' 
      });
    }

    if (approved) {
      // Sales accepts admin changes
      await enrolledClient.update({
        Approval_by_sales: true,
        has_update: false,
        updatedBy
      });
      // Auto-approval by admin will be handled in the beforeUpdate hook
    } else {
      // Sales rejects admin changes
      await enrolledClient.update({
        Approval_by_sales: false,
        has_update: true,
        updatedBy
      });
    }

    res.status(200).json({
      success: true,
      message: approved ? 'Admin changes approved by sales' : 'Admin changes rejected by sales',
      data: enrolledClient
    });

  } catch (error) {
    console.error('Error in sales approval action:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get enrolled clients by lead ID
export const getEnrolledClientByLeadId = async (req, res) => {
  try {
    const { lead_id } = req.params;

    const enrolledClient = await EnrolledClients.findOne({
      where: { lead_id },
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status']
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: Packages,
          as: 'package',
          attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice']
        }
      ]
    });

    if (!enrolledClient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrolled client not found for this lead' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrolled client retrieved successfully',
      data: enrolledClient
    });

  } catch (error) {
    console.error('Error fetching enrolled client by lead ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Delete enrolled client
export const deleteEnrolledClient = async (req, res) => {
  try {
    const { id } = req.params;

    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrolled client not found' 
      });
    }

    await enrolledClient.destroy();

    res.status(200).json({
      success: true,
      message: 'Enrolled client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting enrolled client:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
// Handle error responses
const handleError = (error, res) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: error.message 
  });
}; 

// Get all enrolled clients for sales with categorized data
export const getAllEnrolledClientsForSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, sales_person_id } = req.query;
    const offset = (page - 1) * limit;

    const includeConfig = [
      {
        model: Lead,
        as: 'lead',
        attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status', 'technology', 'country', 'visaStatus'],
        where: { status: 'Enrolled' } // Only get enrolled leads
      },
      {
        model: User,
        as: 'salesPerson',
        attributes: ['id', 'firstname', 'lastname', 'email']
      },
      {
        model: User,
        as: 'admin',
        attributes: ['id', 'firstname', 'lastname', 'email']
      },
      {
        model: Packages,
        as: 'package',
        attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice', 'features']
      }
    ];

    // All Enrollments - get all enrolled leads
    const allEnrollments = await EnrolledClients.findAndCountAll({
      where: sales_person_id ? { Sales_person_id: sales_person_id } : {},
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // Approved Enrollments
    const approvedEnrollments = await EnrolledClients.findAndCountAll({
      where: {
        Approval_by_sales: true,
        Approval_by_admin: true,
        ...(sales_person_id && { Sales_person_id: sales_person_id })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // Admin Review Pending
    const adminReviewPending = await EnrolledClients.findAndCountAll({
      where: {
        packageid: { [Op.ne]: null },
        Approval_by_admin: false,
        has_update: false,
        ...(sales_person_id && { Sales_person_id: sales_person_id })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // My Review (Sales Review Pending)
    const myReview = await EnrolledClients.findAndCountAll({
      where: {
        has_update: true,
        Approval_by_admin: false,
        ...(sales_person_id && { Sales_person_id: sales_person_id })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    const createPaginationInfo = (count) => ({
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      message: 'Enrolled clients retrieved successfully',
      data: {
        AllEnrollments: {
          leads: allEnrollments.rows,
          pagination: createPaginationInfo(allEnrollments.count)
        },
        Approved: {
          leads: approvedEnrollments.rows,
          pagination: createPaginationInfo(approvedEnrollments.count)
        },
        AdminReviewPending: {
          leads: adminReviewPending.rows,
          pagination: createPaginationInfo(adminReviewPending.count)
        },
        MyReview: {
          leads: myReview.rows,
          pagination: createPaginationInfo(myReview.count)
        }
      }
    });

  } catch (error) {
    handleError(error, res);
  }
};

// Get all enrolled clients for admin with categorized data
export const getAllEnrolledClientsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, admin_id } = req.query;
    const offset = (page - 1) * limit;

    const includeConfig = [
      {
        model: Lead,
        as: 'lead',
        attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status', 'technology', 'country', 'visaStatus', 'contactNumbers'],
        where: { status: 'Enrolled' } // Only get enrolled leads
      },
      {
        model: User,
        as: 'salesPerson',
        attributes: ['id', 'firstname', 'lastname', 'email']
      },
      {
        model: User,
        as: 'admin',
        attributes: ['id', 'firstname', 'lastname', 'email']
      },
      {
        model: Packages,
        as: 'package',
        attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice','features']
      }
    ];

    // All Enrollments - get all enrolled leads
    const allEnrollments = await EnrolledClients.findAndCountAll({
      where: admin_id ? { Admin_id: admin_id } : {},
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // Approved Enrollments
    const approvedEnrollments = await EnrolledClients.findAndCountAll({
      where: {
        Approval_by_sales: true,
        Approval_by_admin: true,
        ...(admin_id && { Admin_id: admin_id })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // Sales Review Pending
    const salesReviewPending = await EnrolledClients.findAndCountAll({
      where: {
        has_update: true,
        Approval_by_admin: false,
        ...(admin_id && { Admin_id: admin_id })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    // My Review (Admin Review Pending)
    const myReview = await EnrolledClients.findAndCountAll({
      where: {
        packageid: { [Op.ne]: null },
        Approval_by_admin: false,
        has_update: false,
        ...(admin_id && { Admin_id: admin_id })
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: includeConfig,
      order: [['createdAt', 'DESC']]
    });

    const createPaginationInfo = (count) => ({
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count,
      itemsPerPage: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      message: 'Enrolled clients retrieved successfully',
      data: {
        AllEnrollments: {
          leads: allEnrollments.rows,
          pagination: createPaginationInfo(allEnrollments.count)
        },
        Approved: {
          leads: approvedEnrollments.rows,
          pagination: createPaginationInfo(approvedEnrollments.count)
        },
        SalesReviewPending: {
          leads: salesReviewPending.rows,
          pagination: createPaginationInfo(salesReviewPending.count)
        },
        MyReview: {
          leads: myReview.rows,
          pagination: createPaginationInfo(myReview.count)
        }
      }
    });

  } catch (error) {
    handleError(error, res);
  }
}; 

// Upload resume for enrolled client
export const uploadResume = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided'
      });
    }

    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      // Delete uploaded file if client not found
      await unlinkAsync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Enrolled client not found'
      });
    }

    // Delete old resume if exists
    if (enrolledClient.resume) {
      try {
        await unlinkAsync(enrolledClient.resume);
      } catch (error) {
        console.error('Error deleting old resume:', error);
      }
    }

    // Normalize path with forward slashes
    const normalizedPath = req.file.path.split(path.sep).join('/');

    // Update resume path
    await enrolledClient.update({
      resume: normalizedPath,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumePath: enrolledClient.resume
      }
    });

  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after upload error:', unlinkError);
      }
    }
    console.error('Error uploading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete resume
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({
        success: false,
        message: 'Enrolled client not found'
      });
    }

    if (!enrolledClient.resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this client'
      });
    }

    // Delete resume file
    try {
      await unlinkAsync(enrolledClient.resume);
    } catch (error) {
      console.error('Error deleting resume file:', error);
    }

    // Update client record
    await enrolledClient.update({
      resume: null,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 

// Serve resume file
export const serveResume = async (req, res) => {
  try {
    const { id } = req.params;
    
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient || !enrolledClient.resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Send the file
    res.sendFile(enrolledClient.resume, { root: '.' });

  } catch (error) {
    console.error('Error serving resume:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 

// Helper function to check if client has all required installments
const hasRequiredInstallments = async (clientId) => {
  try {
    // Check if enrollment charge is fully paid
    const enrollmentInstallments = await Installments.findAll({
      where: {
        enrolledClientId: clientId,
        charge_type: 'enrollment_charge',
        paid: true
      }
    });

    if (!enrollmentInstallments.length) return false;

    // Check if offer letter installments exist
    const offerLetterInstallments = await Installments.findAll({
      where: {
        enrolledClientId: clientId,
        charge_type: 'offer_letter_charge'
      }
    });

    if (!offerLetterInstallments.length) return false;

    // Check if first year salary installments exist (if applicable)
    const client = await EnrolledClients.findByPk(clientId);
    if (client.payable_first_year_fixed_charge || client.payable_first_year_percentage) {
      const firstYearInstallments = await Installments.findAll({
        where: {
          enrolledClientId: clientId,
          charge_type: 'first_year_charge'
        }
      });

      if (!firstYearInstallments.length) return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking installments:', error);
    return false;
  }
};

// Get all approved clients for sales accounts page
export const getAllApprovedClientsSale = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get all approved clients
    const approvedClients = await EnrolledClients.findAndCountAll({
      where: {
        Approval_by_sales: true,
        Approval_by_admin: true
      },
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status', 'technology', 'country', 'visaStatus', 'contactNumbers']
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: Packages,
          as: 'package',
          attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice', 'features']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    // Get installments for each client
    const accountsClients = await Promise.all(approvedClients.rows.map(async (client) => {
      // Get enrollment installments
      const enrollmentInstallments = await Installments.findAll({
        where: {
          enrolledClientId: client.id,
          charge_type: 'enrollment_charge'
        }
      });

      // Get offer letter installments
      const offerLetterInstallments = await Installments.findAll({
        where: {
          enrolledClientId: client.id,
          charge_type: 'offer_letter_charge'
        }
      });

      // Get first year installments
      const firstYearInstallments = await Installments.findAll({
        where: {
          enrolledClientId: client.id,
          charge_type: 'first_year_charge'
        }
      });

      // Check if enrollment is paid
      const enrollmentPaid = enrollmentInstallments.some(inst => inst.is_initial_payment && inst.paid);

      // Add installments info to client
      const clientJson = client.toJSON();
      clientJson.enrollment_installments = enrollmentInstallments;
      clientJson.offer_letter_installments = offerLetterInstallments;
      clientJson.first_year_installments = firstYearInstallments;
      clientJson.enrollment_paid = enrollmentPaid;

      return clientJson;
    }));

    // Filter clients that have paid enrollment
    const filteredClients = accountsClients.filter(client => client.enrollment_paid);

    // Calculate pagination
    const totalItems = filteredClients.length;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      message: 'Approved clients for accounts retrieved successfully',
      data: {
        leads: filteredClients,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching approved clients for accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all approved clients for admin accounts page
export const getAllApprovedAdminSale = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get all approved clients
    const approvedClients = await EnrolledClients.findAndCountAll({
      where: {
        Approval_by_sales: true,
        Approval_by_admin: true
      },
      include: [
        // Include your existing associations
      ],
      limit,
      offset,
      distinct: true
    });

    // Filter clients that have all required installments
    const accountsClients = [];
    for (const client of approvedClients.rows) {
      const hasInstallments = await hasRequiredInstallments(client.id);
      if (hasInstallments) {
        accountsClients.push(client);
      }
    }

    // Calculate pagination
    const totalItems = accountsClients.length;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      message: 'Approved clients for admin accounts retrieved successfully',
      data: {
        leads: accountsClients,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching approved clients for admin accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 

// Update offer letter charge (Sales)
export const updateOfferLetterCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { payable_offer_letter_charge, Sales_person_id, updatedBy } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    await enrolledClient.update({
      payable_offer_letter_charge,
      Sales_person_id,
      updatedBy,
      offer_letter_approval_by_sales: false,
      offer_letter_approval_by_admin: false,
      offer_letter_has_update: false
    });
    res.status(200).json({ success: true, message: 'Offer letter charge updated successfully by sales', data: enrolledClient });
  } catch (error) {
    console.error('Error updating offer letter charge:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Admin approval/rejection for offer letter charge
export const adminOfferLetterApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, Admin_id, edited_offer_letter_charge, updatedBy } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    if (approved) {
      await enrolledClient.update({
        offer_letter_approval_by_admin: true,
        Admin_id,
        offer_letter_has_update: false,
        updatedBy,
        edited_offer_letter_charge: enrolledClient.payable_offer_letter_charge
      });
    } else {
      const updateData = {
        offer_letter_approval_by_admin: false,
        Admin_id,
        offer_letter_has_update: true,
        updatedBy
      };
      if (edited_offer_letter_charge !== undefined) {
        updateData.edited_offer_letter_charge = edited_offer_letter_charge;
      }
      await enrolledClient.update(updateData);
    }
    res.status(200).json({ success: true, message: approved ? 'Offer letter charge approved by admin' : 'Offer letter charge updated by admin', data: enrolledClient });
  } catch (error) {
    console.error('Error in admin offer letter approval:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Update first year salary charge (Sales)
export const updateFirstYearCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { payable_first_year_percentage, payable_first_year_fixed_charge, Sales_person_id, updatedBy } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    if (payable_first_year_percentage && payable_first_year_fixed_charge) {
      return res.status(400).json({ success: false, message: 'Cannot set both payable_first_year_percentage and payable_first_year_fixed_charge' });
    }
    await enrolledClient.update({
      payable_first_year_percentage,
      payable_first_year_fixed_charge,
      Sales_person_id,
      updatedBy,
      first_year_approval_by_sales: false,
      first_year_approval_by_admin: false,
      first_year_has_update: false
    });
    res.status(200).json({ success: true, message: 'First year salary charge updated successfully by sales', data: enrolledClient });
  } catch (error) {
    console.error('Error updating first year salary charge:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Admin approval/rejection for first year salary charge
export const adminFirstYearApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, Admin_id, edited_first_year_percentage, edited_first_year_fixed_charge, updatedBy } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    if (approved) {
      await enrolledClient.update({
        first_year_approval_by_admin: true,
        Admin_id,
        first_year_has_update: false,
        updatedBy,
        edited_first_year_percentage: enrolledClient.payable_first_year_percentage,
        edited_first_year_fixed_charge: enrolledClient.payable_first_year_fixed_charge
      });
    } else {
      const updateData = {
        first_year_approval_by_admin: false,
        Admin_id,
        first_year_has_update: true,
        updatedBy
      };
      if (edited_first_year_percentage !== undefined) {
        updateData.edited_first_year_percentage = edited_first_year_percentage;
      }
      if (edited_first_year_fixed_charge !== undefined) {
        updateData.edited_first_year_fixed_charge = edited_first_year_fixed_charge;
      }
      await enrolledClient.update(updateData);
    }
    res.status(200).json({ success: true, message: approved ? 'First year salary charge approved by admin' : 'First year salary charge updated by admin', data: enrolledClient });
  } catch (error) {
    console.error('Error in admin first year approval:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}; 
