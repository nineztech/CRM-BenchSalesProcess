import ArchivedLead from "../models/archivedLeadModel.js";
import Lead from "../models/leadModel.js";
import User from "../models/userModel.js";
import { Op } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

// Get all archived leads with pagination and filtering
export const getArchivedLeads = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status,
      search,
      sortBy = 'archivedAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { primaryEmail: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const archivedLeads = await ArchivedLead.findAndCountAll({
      where: whereClause,
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
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(archivedLeads.count / parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Archived leads fetched successfully',
      data: {
        leads: archivedLeads.rows,
        pagination: {
          total: archivedLeads.count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching archived leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching archived leads'
    });
  }
};

// Reopen an archived lead
export const reopenArchivedLead = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { remark } = req.body;

    // Find the archived lead
    const archivedLead = await ArchivedLead.findByPk(id);
    if (!archivedLead) {
      return res.status(404).json({
        success: false,
        message: 'Archived lead not found'
      });
    }

    // Create a new lead from the archived data
    const leadData = {
      ...archivedLead.toJSON(),
      status: 'open',
      remarks: [
        {
          text: remark || 'Lead reopened from archive',
          createdAt: new Date().toISOString(),
          createdBy: req.user.id,
          statusChange: {
            from: 'archived',
            to: 'open'
          }
        }
      ]
    };

    // Remove fields that shouldn't be copied
    delete leadData.id;
    delete leadData.archivedAt;
    delete leadData.reopenedAt;
    delete leadData.archiveReason;
    delete leadData.originalLeadId;

    // Create new lead
    const newLead = await Lead.create(leadData, { transaction });

    // Update archived lead status
    await archivedLead.update({
      status: 'active',
      reopenedAt: new Date(),
      updatedBy: req.user.id
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Lead reopened successfully',
      data: {
        lead: newLead,
        archivedLead: archivedLead
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error reopening archived lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while reopening lead'
    });
  }
};

// Get a single archived lead by ID
export const getArchivedLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const archivedLead = await ArchivedLead.findByPk(id, {
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
      ]
    });

    if (!archivedLead) {
      return res.status(404).json({
        success: false,
        message: 'Archived lead not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Archived lead fetched successfully',
      data: archivedLead
    });

  } catch (error) {
    console.error('Error fetching archived lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching archived lead'
    });
  }
};

// Update archived lead status
export const updateArchivedLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either "active" or "inactive"'
      });
    }

    // Find the archived lead
    const archivedLead = await ArchivedLead.findByPk(id);
    if (!archivedLead) {
      return res.status(404).json({
        success: false,
        message: 'Archived lead not found'
      });
    }

    // Update the status
    await archivedLead.update({
      status,
      updatedBy: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: 'Archived lead status updated successfully',
      data: archivedLead
    });

  } catch (error) {
    console.error('Error updating archived lead status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error occurred while updating archived lead status'
    });
  }
}; 