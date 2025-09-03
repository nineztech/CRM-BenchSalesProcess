import ResumeChecklist from "../models/resumeChecklistModel.js";
import { ValidationError, UniqueConstraintError, Op } from "sequelize";
import User from "../models/userModel.js";
import ClientUser from "../models/clientUserModel.js";
import EnrolledClients from "../models/enrolledClientsModel.js";
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

const unlinkAsync = promisify(fs.unlink);

// Create Resume Checklist
export const createResumeChecklist = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: [{
          field: 'authentication',
          message: 'User must be authenticated to create a resume checklist'
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
      personalInformation,
      educationalInformation,
      technicalInformation,
      currentInformation,
      addressHistory,
      visaExperienceCertificate,
      remarks,
      status
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'personalInformation',
      'educationalInformation',
      'technicalInformation',
      'currentInformation',
      'addressHistory',
      'visaExperienceCertificate'
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

    // Validate status if provided
    if (status) {
      const validStatuses = ['draft', 'completed', 'submitted'];
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

    // Get enrolled client resume if clientUserId exists
    let defaultResumePath = null;
    if (req.user.clientUserId) {
      const clientUser = await ClientUser.findByPk(req.user.clientUserId, {
        include: [{
          model: EnrolledClients,
          as: 'enrolledClient',
          attributes: ['id', 'resume']
        }]
      });
      
      if (clientUser?.enrolledClient?.resume) {
        defaultResumePath = clientUser.enrolledClient.resume;
      }
    }

    // Create resume checklist data object
    const checklistData = {
      personalInformation,
      educationalInformation,
      technicalInformation,
      currentInformation,
      addressHistory,
      visaExperienceCertificate,
      remarks: remarks || null,
      status: status || 'draft',
      clientUserId: req.user.clientUserId || null,
      resume: defaultResumePath, // Set default resume from enrolled client
      isResumeUpdated: false, // Not updated yet
      createdBy: req.user.id,
      updatedBy: null
    };

    // Create the resume checklist
    const newChecklist = await ResumeChecklist.create(checklistData);

    // Fetch the created checklist with associations to get full user details
    const checklistWithAssociations = await ResumeChecklist.findByPk(newChecklist.id, {
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
      message: 'Resume checklist created successfully',
      data: checklistWithAssociations
    });

  } catch (error) {
    console.error('Error creating resume checklist:', error);

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

    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while creating resume checklist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Resume Checklists with filtering and pagination
export const getAllResumeChecklists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';
    const statusFilter = req.query.statusFilter;
    const createdByFilter = req.query.createdByFilter;

    // Helper function to build filter conditions
    const buildFilterConditions = (baseWhere = {}) => {
      let whereConditions = { ...baseWhere };

      if (statusFilter) {
        whereConditions.status = statusFilter;
      }

      if (createdByFilter) {
        const [firstName, lastName] = createdByFilter.split(' ');
        whereConditions['$creator.firstname$'] = {
          [Op.like]: `%${firstName}%`
        };
        if (lastName) {
          whereConditions['$creator.lastname$'] = {
            [Op.like]: `%${lastName}%`
          };
        }
      }

      return whereConditions;
    };

    // Base include for all queries
    const includeOptions = [
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
    ];

    // Get all resume checklists
    const checklists = await ResumeChecklist.findAndCountAll({
      where: buildFilterConditions(),
      include: includeOptions,
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: limit
    });

    const totalPages = Math.ceil(checklists.count / limit);

    return res.status(200).json({
      success: true,
      message: 'Resume checklists fetched successfully',
      data: {
        checklists: checklists.rows,
        pagination: {
          total: checklists.count,
          totalPages,
          currentPage: page,
          limit: limit
        }
      }
    });

  } catch (error) {
    console.error('Error in getAllResumeChecklists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume checklists',
      error: error.message
    });
  }
};

// Get Resume Checklists by User
export const getResumeChecklistsByUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';
    const statusFilter = req.query.statusFilter;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: [{
          field: 'authentication',
          message: 'User must be authenticated to view resume checklists'
        }]
      });
    }

    // Build where conditions
    let whereConditions = {
      createdBy: req.user.id
    };

    if (statusFilter) {
      whereConditions.status = statusFilter;
    }

    // Base include for all queries
    const includeOptions = [
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
    ];

    // Get user's resume checklists
    const checklists = await ResumeChecklist.findAndCountAll({
      where: whereConditions,
      include: includeOptions,
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: limit
    });

    const totalPages = Math.ceil(checklists.count / limit);

    return res.status(200).json({
      success: true,
      message: 'User resume checklists fetched successfully',
      data: {
        checklists: checklists.rows,
        pagination: {
          total: checklists.count,
          totalPages,
          currentPage: page,
          limit: limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user resume checklists:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching user resume checklists',
      error: error.message
    });
  }
};

// Get Resume Checklist by ID
export const getResumeChecklistById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the resume checklist
    const checklist = await ResumeChecklist.findByPk(id, {
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

    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Resume checklist not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resume checklist fetched successfully',
      data: checklist
    });

  } catch (error) {
    console.error('Error fetching resume checklist:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching resume checklist',
      error: error.message
    });
  }
};

// Update Resume Checklist
export const updateResumeChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the resume checklist
    const checklist = await ResumeChecklist.findByPk(id);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Resume checklist not found'
      });
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['draft', 'completed', 'submitted'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
    }

    // Add updatedBy field
    updateData.updatedBy = req.user.id;

    // Update the resume checklist
    await checklist.update(updateData);

    // Fetch updated checklist with associations
    const updatedChecklist = await ResumeChecklist.findByPk(id, {
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

    return res.status(200).json({
      success: true,
      message: 'Resume checklist updated successfully',
      data: updatedChecklist
    });

  } catch (error) {
    console.error('Error updating resume checklist:', error);

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
      message: 'Internal server error occurred while updating resume checklist'
    });
  }
};

// Update Resume Checklist Status
export const updateResumeChecklistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'completed', 'submitted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Find the resume checklist
    const checklist = await ResumeChecklist.findByPk(id);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Resume checklist not found'
      });
    }

    // Update the status
    await checklist.update({
      status,
      updatedBy: req.user.id
    });

    // Fetch updated checklist with associations
    const updatedChecklist = await ResumeChecklist.findByPk(id, {
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

    return res.status(200).json({
      success: true,
      message: 'Resume checklist status updated successfully',
      data: updatedChecklist
    });

  } catch (error) {
    console.error('Error updating resume checklist status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while updating resume checklist status'
    });
  }
};

// Delete Resume Checklist
export const deleteResumeChecklist = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the resume checklist
    const checklist = await ResumeChecklist.findByPk(id);
    if (!checklist) {
      return res.status(404).json({
        success: false,
        message: 'Resume checklist not found'
      });
    }

    // Delete the resume checklist
    await checklist.destroy();

    return res.status(200).json({
      success: true,
      message: 'Resume checklist deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resume checklist:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while deleting resume checklist'
    });
  }
};

// Get filter options (creators) from all resume checklists
export const getResumeChecklistFilterOptions = async (req, res) => {
  try {
    // Get all resume checklists with creators
    const checklists = await ResumeChecklist.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstname', 'lastname']
        }
      ],
      attributes: ['status']
    });

    // Extract unique creators
    const creatorsSet = new Set();
    checklists.forEach(checklist => {
      if (checklist.creator && checklist.creator.firstname && checklist.creator.lastname) {
        creatorsSet.add(`${checklist.creator.firstname} ${checklist.creator.lastname}`);
      }
    });

    // Extract unique statuses
    const statusesSet = new Set();
    checklists.forEach(checklist => {
      if (checklist.status) {
        statusesSet.add(checklist.status);
      }
    });

    // Convert to arrays and sort
    const creators = Array.from(creatorsSet).sort();
    const statuses = Array.from(statusesSet).sort();

    // Add all possible statuses to ensure they're always available
    const allPossibleStatuses = ['draft', 'completed', 'submitted'];
    allPossibleStatuses.forEach(status => {
      if (!statuses.includes(status)) {
        statuses.push(status);
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        creators,
        statuses: statuses.sort()
      }
    });

  } catch (error) {
    console.error('Error getting resume checklist filter options:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while getting filter options'
    });
  }
};

// Get resume from enrolled client for checklist creation
export const getEnrolledClientResume = async (req, res) => {
  try {
    const { clientUserId } = req.params;
    
    // Find the client user
    const clientUser = await ClientUser.findByPk(clientUserId, {
      include: [{
        model: EnrolledClients,
        as: 'enrolledClient',
        attributes: ['id', 'resume']
      }]
    });

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'Client user not found'
      });
    }

    const resumePath = clientUser.enrolledClient?.resume || null;
    
    return res.status(200).json({
      success: true,
      data: {
        resumePath,
        hasResume: !!resumePath
      }
    });
  } catch (error) {
    console.error('Error fetching enrolled client resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get resume from enrolled client for current user
export const getCurrentUserEnrolledClientResume = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find the client user by the authenticated user's ID
    const clientUser = await ClientUser.findOne({
      where: { id: req.user.id },
      include: [{
        model: EnrolledClients,
        as: 'enrolledClient',
        attributes: ['id', 'resume']
      }]
    });

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'Client user not found'
      });
    }

    const resumePath = clientUser.enrolledClient?.resume || null;
    const enrolledClientId = clientUser.enrolledClient?.id || null;
    
    return res.status(200).json({
      success: true,
      data: {
        resumePath,
        hasResume: !!resumePath,
        enrolledClientId
      }
    });
  } catch (error) {
    console.error('Error fetching current user enrolled client resume:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload resume for checklist (only during creation)
export const uploadChecklistResume = async (req, res) => {
  try {
    const { checklistId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided'
      });
    }

    const checklist = await ResumeChecklist.findByPk(checklistId);
    if (!checklist) {
      // Delete uploaded file if checklist not found
      await unlinkAsync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Resume checklist not found'
      });
    }

    // Check if resume has already been updated
    if (checklist.isResumeUpdated) {
      await unlinkAsync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Resume can only be updated once during checklist creation'
      });
    }

    // Delete old resume if exists
    if (checklist.resume) {
      try {
        await unlinkAsync(checklist.resume);
      } catch (error) {
        console.error('Error deleting old resume:', error);
      }
    }

    // Normalize path with forward slashes
    const normalizedPath = req.file.path.split(path.sep).join('/');

    // Update resume path and mark as updated
    await checklist.update({
      resume: normalizedPath,
      isResumeUpdated: true,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumePath: checklist.resume
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
    console.error('Error uploading checklist resume:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Serve checklist resume file
export const serveChecklistResume = async (req, res) => {
  try {
    const { checklistId } = req.params;
    
    const checklist = await ResumeChecklist.findByPk(checklistId);
    if (!checklist || !checklist.resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Send the file
    res.sendFile(checklist.resume, { root: '.' });

  } catch (error) {
    console.error('Error serving checklist resume:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
