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
import { searchEnrolledClients } from '../config/elasticSearch.js';
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
      is_training_required,
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
      is_training_required,
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
          net_amount: inst.amount,
          edited_dueDate: inst.dueDate,
          edited_remark: inst.remark,
          has_admin_update: false
        });
      }
      // --- END NEW LOGIC ---

      // If both admin and sales have approved, mark initial payment as paid (only for enrollment charge)
      if (enrolledClient.Approval_by_sales && !enrolledClient.clientUserCreated) {
        // Find and update initial payment for enrollment charge only
        const initialPayment = await Installments.findOne({
          where: {
            enrolledClientId: id,
            installment_number: 0,
            is_initial_payment: true,
            charge_type: 'enrollment_charge'
          }
        });

        if (initialPayment) {
          await initialPayment.update({
            paid: true,
            paidDate: new Date(),
            paid_at: new Date()
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
      // Sales accepts admin changes - copy edited values to payable fields
      await enrolledClient.update({
        Approval_by_sales: true,
        has_update: false,
        updatedBy,
        // Copy admin's edited values to payable fields
        payable_enrollment_charge: enrolledClient.edited_enrollment_charge,
        payable_offer_letter_charge: enrolledClient.edited_offer_letter_charge,
        payable_first_year_percentage: enrolledClient.edited_first_year_percentage,
        payable_first_year_fixed_charge: enrolledClient.edited_first_year_fixed_charge
      });

      // Update any installments that have edited_amount values
      const installmentsWithEdits = await Installments.findAll({
        where: {
          enrolledClientId: id,
          has_admin_update: true,
          sales_approval: false
        }
      });

      for (const installment of installmentsWithEdits) {
        if (installment.edited_amount) {
          await installment.update({
            amount: installment.edited_amount,
            net_amount: installment.edited_amount,
            dueDate: installment.edited_dueDate || installment.dueDate,
            remark: installment.edited_remark || installment.remark,
            sales_approval: true,
            has_admin_update: false,
            // Keep edited values (don't clear them)
            edited_amount: installment.edited_amount,
            edited_dueDate: installment.edited_dueDate,
            edited_remark: installment.edited_remark
          });
        }
      }
      
      // If both admin and sales have approved, mark initial payment as paid (only for enrollment charge)
      if (enrolledClient.Approval_by_admin && !enrolledClient.clientUserCreated) {
        // Find and update initial payment for enrollment charge only
        const initialPayment = await Installments.findOne({
          where: {
            enrolledClientId: id,
            installment_number: 0,
            is_initial_payment: true,
            charge_type: 'enrollment_charge'
          }
        });

        if (initialPayment) {
          await initialPayment.update({
            paid: true,
            paidDate: new Date(),
            paid_at: new Date()
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
    const { page = 1, limit = 10, sales_person_id, search, tabType } = req.query;
    
    // If search is provided, use Elasticsearch
    if (search && search.trim() !== '') {
      try {
        const searchResult = await searchEnrolledClients(search, tabType, parseInt(page), parseInt(limit));
        
        // Transform the search results to match the expected format
        const transformedResults = searchResult.enrolledClients.map(client => ({
          ...client,
          // Ensure all required fields are present
          lead: client.lead || {},
          package: client.package || null,
          salesPerson: client.salesPerson || null,
          admin: client.admin || null,
          assignedMarketingTeam: client.assignedMarketingTeam || null
        }));

        const createPaginationInfo = (count) => ({
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        });

        // Return search results in the same format as regular results
        return res.status(200).json({
          success: true,
          message: 'Enrolled clients retrieved successfully',
          data: {
            AllEnrollments: {
              leads: tabType === 'all' || !tabType ? transformedResults : [],
              pagination: createPaginationInfo(tabType === 'all' || !tabType ? searchResult.total : 0)
            },
            Approved: {
              leads: tabType === 'approved' ? transformedResults : [],
              pagination: createPaginationInfo(tabType === 'approved' ? searchResult.total : 0)
            },
            AdminReviewPending: {
              leads: tabType === 'admin_pending' ? transformedResults : [],
              pagination: createPaginationInfo(tabType === 'admin_pending' ? searchResult.total : 0)
            },
            MyReview: {
              leads: tabType === 'my_review' ? transformedResults : [],
              pagination: createPaginationInfo(tabType === 'my_review' ? searchResult.total : 0)
            }
          }
        });
      } catch (searchError) {
        console.error('Elasticsearch search error:', searchError);
        // Fall back to database search if Elasticsearch fails
      }
    }

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
      },
      {
        model: User,
        as: 'assignedMarketingTeam',
        attributes: ['id', 'firstname', 'lastname', 'email']
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
    console.error('Error fetching enrolled clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled clients',
      error: error.message
    });
  }
};

// Get all enrolled clients for admin with categorized data
export const getAllEnrolledClientsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, admin_id, search, tabType } = req.query;
    const offset = (page - 1) * limit;

    // If search query is provided, use Elasticsearch
    if (search && search.trim()) {
      try {
        const searchResults = await searchEnrolledClients(search, tabType, parseInt(page), parseInt(limit));
        
        // Transform Elasticsearch results to match expected format
        const transformedResults = searchResults.enrolledClients.map(client => ({
          id: client.id,
          lead_id: client.lead_id,
          packageid: client.packageid,
          payable_enrollment_charge: client.payable_enrollment_charge,
          payable_offer_letter_charge: client.payable_offer_letter_charge,
          payable_first_year_percentage: client.payable_first_year_percentage,
          payable_first_year_fixed_charge: client.payable_first_year_fixed_charge,
          Approval_by_sales: client.Approval_by_sales,
          Sales_person_id: client.Sales_person_id,
          Approval_by_admin: client.Approval_by_admin,
          Admin_id: client.Admin_id,
          has_update: client.has_update,
          edited_enrollment_charge: client.edited_enrollment_charge,
          edited_offer_letter_charge: client.edited_offer_letter_charge,
          edited_first_year_percentage: client.edited_first_year_percentage,
          edited_first_year_fixed_charge: client.edited_first_year_fixed_charge,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          is_training_required: client.is_training_required,
          first_call_status: client.first_call_status,
          lead: client.lead,
          package: client.package,
          salesPerson: client.salesPerson,
          admin: client.admin,
          resume: client.resume,
          assignedMarketingTeam: client.assignedMarketingTeam
        }));

        const createPaginationInfo = (total) => ({
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        });

        // Filter results based on tabType
        let filteredResults = transformedResults;
        let totalCount = searchResults.total;

        if (tabType === 'approved') {
          filteredResults = transformedResults.filter(client => 
            client.Approval_by_sales && client.Approval_by_admin
          );
          totalCount = filteredResults.length;
        } else if (tabType === 'sales_pending') {
          filteredResults = transformedResults.filter(client => 
            client.has_update && !client.Approval_by_admin
          );
          totalCount = filteredResults.length;
        } else if (tabType === 'my_review') {
          filteredResults = transformedResults.filter(client => 
            client.packageid && !client.Approval_by_admin && !client.has_update
          );
          totalCount = filteredResults.length;
        }

        res.status(200).json({
          success: true,
          message: 'Enrolled clients retrieved successfully',
          data: {
            AllEnrollments: {
              leads: tabType === 'all' ? filteredResults : [],
              pagination: createPaginationInfo(tabType === 'all' ? totalCount : 0)
            },
            Approved: {
              leads: tabType === 'approved' ? filteredResults : [],
              pagination: createPaginationInfo(tabType === 'approved' ? totalCount : 0)
            },
            SalesReviewPending: {
              leads: tabType === 'sales_pending' ? filteredResults : [],
              pagination: createPaginationInfo(tabType === 'sales_pending' ? totalCount : 0)
            },
            MyReview: {
              leads: tabType === 'my_review' ? filteredResults : [],
              pagination: createPaginationInfo(tabType === 'my_review' ? totalCount : 0)
            }
          }
        });
        return;
      } catch (error) {
        console.error('Error searching enrolled clients:', error);
        // Fall back to database query if Elasticsearch fails
      }
    }

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
      },
      {
        model: User,
        as: 'assignedMarketingTeam',
        attributes: ['id', 'firstname', 'lastname', 'email']
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

    // Only clients with paid enrollment
    const filteredClients = accountsClients.filter(client => client.enrollment_paid);

    // Categorize clients for each tab/object
    let allApproved = [];
    const myReview = [];
    const adminReview = [];
    const finalApproval = [];

    for (const client of filteredClients) {
      // Final Approval: both sales and admin have approved final configuration
      if (
        client.final_approval_sales && 
        client.final_approval_by_admin
      ) {
        finalApproval.push(client);
      }
      // My Review: admin has made changes and sent back to sales for review
      else if (client.has_update && client.final_approval_sales && !client.final_approval_by_admin) {
        myReview.push(client);
      }
      // Admin Review: sales has configured and waiting for admin approval
      else if (
        client.has_update_in_final &&
        !client.final_approval_by_admin
      ) {
        adminReview.push(client);
      }
      // All Approved: leads that were approved during enrollment but haven't been configured for offer letter/first year
      else if (
        !client.offer_letter_installments.length &&
        !client.first_year_installments.length
      ) {
        allApproved.push(client);
      }
    }

    // --- Add all "Approved" clients from getAllEnrolledClientsForSales to allApproved ---
    // These are all clients with Approval_by_sales: true, Approval_by_admin: true
    for (const client of filteredClients) {
      if (!allApproved.some(c => c.id === client.id)) {
        allApproved.push(client);
      }
    }
    // --- End addition ---

    // Pagination helper
    const paginate = (arr) => {
      const totalItems = arr.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      return {
        leads: arr.slice((page - 1) * limit, page * limit),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    };

    res.status(200).json({
      success: true,
      message: 'Approved clients for accounts retrieved successfully',
      data: {
        'All Approved': paginate(allApproved),
        'My Review': paginate(myReview),
        'Admin Review': paginate(adminReview),
        'Final Approval': paginate(finalApproval)
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

    // Only clients with paid enrollment
    const filteredClients = accountsClients.filter(client => client.enrollment_paid);

    // Categorize clients for each tab/object
    let allApproved = [];
    const salesReviewPending = [];
    const myReview = [];
    const finalApproval = [];

    for (const client of filteredClients) {
      // Final Approval: both sales and admin have approved final configuration
      if (
        client.final_approval_sales && 
        client.final_approval_by_admin
      ) {
        finalApproval.push(client);
      }
      // Sales Review Pending: admin has made changes and sent back to sales for review
      else if (client.has_update && client.final_approval_sales && !client.final_approval_by_admin) {
        salesReviewPending.push(client);
      }
      // My Review: sales has configured and waiting for admin review
      else if (
        client.has_update_in_final &&
        !client.final_approval_by_admin
      ) {
        myReview.push(client);
      }
      // All Approved: leads that were approved during enrollment but haven't been configured for offer letter/first year
      else if (
        !client.offer_letter_installments.length &&
        !client.first_year_installments.length
      ) {
        allApproved.push(client);
      }
    }

    // --- Add all "Approved" clients from getAllEnrolledClientsForAdmin to allApproved ---
    // These are all clients with Approval_by_sales: true, Approval_by_admin: true
    for (const client of filteredClients) {
      if (!allApproved.some(c => c.id === client.id)) {
        allApproved.push(client);
      }
    }
    // --- End addition ---

    // Pagination helper
    const paginate = (arr) => {
      const totalItems = arr.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      return {
        leads: arr.slice((page - 1) * limit, page * limit),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    };

    res.status(200).json({
      success: true,
      message: 'Approved clients for admin accounts retrieved successfully',
      data: {
        'All Approved': paginate(allApproved),
        'Sales Review Pending': paginate(salesReviewPending),
        'My Review': paginate(myReview),
        'Final Approval': paginate(finalApproval)
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

// Update final configuration (Sales) - Combined offer letter and first year
export const updateFinalConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      payable_offer_letter_charge, 
      payable_first_year_percentage, 
      payable_first_year_fixed_charge,
      net_payable_first_year_price,
      first_year_salary,
      is_training_required,
      Sales_person_id, 
      updatedBy 
    } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    
    // Validation: Only one of percentage or fixed charge should be provided
    if (payable_first_year_percentage && payable_first_year_fixed_charge) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot set both payable_first_year_percentage and payable_first_year_fixed_charge' 
      });
    }

    // Validation: First year salary is required when first year percentage is set
    if (payable_first_year_percentage && !first_year_salary) {
      return res.status(400).json({ 
        success: false, 
        message: 'First year salary is required when first year percentage is set' 
      });
    }

    // Only update offer letter and first year fields, preserve enrollment charge
    await enrolledClient.update({
      payable_offer_letter_charge,
      payable_first_year_percentage,
      payable_first_year_fixed_charge,
      net_payable_first_year_price,
      first_year_salary,
      is_training_required,
      Sales_person_id,
      updatedBy,
      final_approval_sales: true,
      final_approval_by_admin: false,
      has_update_in_final: true,
      has_update: false // Reset has_update when sales submits for admin review
    });
    res.status(200).json({ success: true, message: 'Final configuration updated successfully by sales', data: enrolledClient });
  } catch (error) {
    console.error('Error updating final configuration:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Admin approval/rejection for final configuration
export const adminFinalApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      approved, 
      Admin_id, 
      edited_offer_letter_charge, 
      edited_first_year_percentage, 
      edited_first_year_fixed_charge,
      edited_net_payable_first_year_price,
      edited_first_year_salary,
      updatedBy 
    } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    if (approved) {
      // Admin approves - move to final approval
      await enrolledClient.update({
        final_approval_by_admin: true,
        Admin_id,
        has_update_in_final: false,
        has_update: false,
        updatedBy,
        edited_offer_letter_charge: enrolledClient.payable_offer_letter_charge,
        edited_first_year_percentage: enrolledClient.payable_first_year_percentage,
        edited_first_year_fixed_charge: enrolledClient.payable_first_year_fixed_charge,
        edited_net_payable_first_year_price: enrolledClient.net_payable_first_year_price,
        edited_first_year_salary: enrolledClient.first_year_salary
      });

      // --- NEW LOGIC: Update all related installments' edit fields ---
      const allInstallments = await Installments.findAll({
        where: { enrolledClientId: id }
      });
      for (const inst of allInstallments) {
        await inst.update({
          edited_amount: inst.amount,
          net_amount: inst.amount,
          edited_dueDate: inst.dueDate,
          edited_remark: inst.remark,
          has_admin_update: false
        });
      }
      // --- END NEW LOGIC ---
    } else {
      // Admin rejects and makes changes - send back to sales for review
      const updateData = {
        final_approval_by_admin: false,
        Admin_id,
        has_update_in_final: false,
        has_update: true, // Set has_update to true to indicate admin has made changes
        updatedBy
      };
      if (edited_offer_letter_charge !== undefined) {
        updateData.edited_offer_letter_charge = edited_offer_letter_charge;
      }
      if (edited_first_year_percentage !== undefined) {
        updateData.edited_first_year_percentage = edited_first_year_percentage;
      }
      if (edited_first_year_fixed_charge !== undefined) {
        updateData.edited_first_year_fixed_charge = edited_first_year_fixed_charge;
      }
      if (edited_net_payable_first_year_price !== undefined) {
        updateData.edited_net_payable_first_year_price = edited_net_payable_first_year_price;
      }
      if (edited_first_year_salary !== undefined) {
        updateData.edited_first_year_salary = edited_first_year_salary;
      }
      await enrolledClient.update(updateData);
    }
    res.status(200).json({ success: true, message: approved ? 'Final configuration approved by admin' : 'Final configuration updated by admin', data: enrolledClient });
  } catch (error) {
    console.error('Error in admin final approval:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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
      final_approval_sales: true,
      final_approval_by_admin: false,
      has_update_in_final: true,
      has_update: true
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
        final_approval_by_admin: true,
        Admin_id,
        has_update_in_final: false,
        updatedBy,
        edited_offer_letter_charge: enrolledClient.payable_offer_letter_charge
      });
    } else {
      const updateData = {
        final_approval_by_admin: false,
        Admin_id,
        has_update_in_final: true,
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
    const { 
      payable_first_year_percentage, 
      payable_first_year_fixed_charge, 
      net_payable_first_year_price,
      Sales_person_id, 
      updatedBy 
    } = req.body;
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
      net_payable_first_year_price,
      Sales_person_id,
      updatedBy,
      final_approval_sales: false,
      final_approval_by_admin: false,
      has_update_in_final: false
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
    const { 
      approved, 
      Admin_id, 
      edited_first_year_percentage, 
      edited_first_year_fixed_charge, 
      edited_net_payable_first_year_price,
      updatedBy 
    } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }
    if (approved) {
      await enrolledClient.update({
        final_approval_by_admin: true,
        Admin_id,
        has_update_in_final: false,
        updatedBy,
        edited_first_year_percentage: enrolledClient.payable_first_year_percentage,
        edited_first_year_fixed_charge: enrolledClient.payable_first_year_fixed_charge,
        edited_net_payable_first_year_price: enrolledClient.net_payable_first_year_price
      });
    } else {
      const updateData = {
        final_approval_by_admin: false,
        Admin_id,
        has_update_in_final: true,
        updatedBy
      };
      if (edited_first_year_percentage !== undefined) {
        updateData.edited_first_year_percentage = edited_first_year_percentage;
      }
      if (edited_first_year_fixed_charge !== undefined) {
        updateData.edited_first_year_fixed_charge = edited_first_year_fixed_charge;
      }
      if (edited_net_payable_first_year_price !== undefined) {
        updateData.edited_net_payable_first_year_price = edited_net_payable_first_year_price;
      }
      await enrolledClient.update(updateData);
    }
    res.status(200).json({ success: true, message: approved ? 'First year salary charge approved by admin' : 'First year salary charge updated by admin', data: enrolledClient });
  } catch (error) {
    console.error('Error in admin first year approval:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}; 

// Sales accepts admin changes and moves to final approval
export const salesAcceptAdminChanges = async (req, res) => {
  try {
    const { id } = req.params;
    const { Sales_person_id, updatedBy } = req.body;
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }

    // Check if admin has made changes (has_update should be true)
    if (!enrolledClient.has_update) {
      return res.status(400).json({ 
        success: false, 
        message: 'No admin changes to accept' 
      });
    }

    // Apply admin's edited values to the main fields
    await enrolledClient.update({
      payable_offer_letter_charge: enrolledClient.edited_offer_letter_charge,
      payable_first_year_percentage: enrolledClient.edited_first_year_percentage,
      payable_first_year_fixed_charge: enrolledClient.edited_first_year_fixed_charge,
      net_payable_first_year_price: enrolledClient.edited_net_payable_first_year_price,
      first_year_salary: enrolledClient.edited_first_year_salary,
      Sales_person_id,
      updatedBy,
      final_approval_sales: true,
      final_approval_by_admin: true, // Set to true since sales accepts admin changes
      has_update_in_final: false,
      has_update: false
    });

    // --- NEW LOGIC: Update all related installments' amount and net_amount fields ---
    const allInstallments = await Installments.findAll({
      where: { enrolledClientId: id }
    });
    for (const inst of allInstallments) {
      await inst.update({
        amount: inst.edited_amount,
        net_amount: inst.edited_amount
      });
    }
    // --- END NEW LOGIC ---

    res.status(200).json({ 
      success: true, 
      message: 'Admin changes accepted by sales and moved to final approval', 
      data: enrolledClient 
    });
  } catch (error) {
    console.error('Error in sales accepting admin changes:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Update first call status
export const updateFirstCallStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_call_status, updatedBy } = req.body;
    
    const enrolledClient = await EnrolledClients.findByPk(id);
    if (!enrolledClient) {
      return res.status(404).json({ success: false, message: 'Enrolled client not found' });
    }

    // Validate status value
    const validStatuses = ['pending', 'onhold', 'done'];
    if (!validStatuses.includes(first_call_status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid first call status. Must be one of: pending, onhold, done' 
      });
    }

    await enrolledClient.update({
      first_call_status,
      updatedBy
    });

    res.status(200).json({ 
      success: true, 
      message: 'First call status updated successfully', 
      data: enrolledClient 
    });
  } catch (error) {
    console.error('Error updating first call status:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}; 
