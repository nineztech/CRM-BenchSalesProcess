import Installments from '../models/installmentsModel.js';
import EnrolledClients from '../models/enrolledClientsModel.js';
import { Op, Sequelize } from 'sequelize';

// Helper function to calculate total installment amount
const calculateTotalInstallmentAmount = async (enrolledClientId, charge_type) => {
  const installments = await Installments.findAll({
    where: { enrolledClientId, charge_type },
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'total_amount']
    ],
    raw: true
  });
  return Number(installments[0].total_amount) || 0;
};

// Helper function to validate and get remaining amount
const validateAndGetRemainingAmount = async (enrolledClientId, charge_type) => {
  const enrolledClient = await EnrolledClients.findByPk(enrolledClientId);
  if (!enrolledClient) {
    throw new Error('Enrolled client not found');
  }

  let totalCharge = 0;
  switch (charge_type) {
    case 'enrollment_charge':
      totalCharge = enrolledClient.payable_enrollment_charge || 0;
      break;
    case 'offer_letter_charge':
      totalCharge = enrolledClient.payable_offer_letter_charge || 0;
      break;
    case 'first_year_charge':
      totalCharge = enrolledClient.payable_first_year_fixed_charge || 0;
      break;
    default:
      throw new Error('Invalid charge type');
  }

  const totalInstallments = await calculateTotalInstallmentAmount(enrolledClientId, charge_type);
  const remainingAmount = totalCharge - totalInstallments;

  return {
    totalCharge,
    totalInstallments,
    remainingAmount
  };
};

// Create installment
export const createInstallment = async (req, res) => {
  try {
    const {
      enrolledClientId,
      charge_type,
      amount,
      dueDate,
      remark,
      installment_number,
      is_initial_payment = false
    } = req.body;

    // Get remaining amount and validate
    const { totalCharge, totalInstallments, remainingAmount } = await validateAndGetRemainingAmount(enrolledClientId, charge_type);

    // Skip remaining amount validation for initial payment
    if (!is_initial_payment) {
      // Validate if new installment amount exceeds remaining amount
      if (amount > remainingAmount) {
        return res.status(400).json({
          success: false,
          message: `Installment amount exceeds remaining amount. Maximum allowed: ${remainingAmount}`,
          data: {
            totalCharge,
            totalInstallments,
            remainingAmount
          }
        });
      }
    }

    // Check if installment number already exists for this enrolled client
    const existingInstallment = await Installments.findOne({
      where: {
        enrolledClientId,
        installment_number
      }
    });

    if (existingInstallment) {
      return res.status(400).json({
        success: false,
        message: `Installment number ${installment_number} already exists for this enrolled client`
      });
    }

    // If installment_number is not provided, auto-generate it
    let finalInstallmentNumber = installment_number;
    if (!finalInstallmentNumber) {
      const lastInstallment = await Installments.findOne({
        where: { enrolledClientId },
        order: [['installment_number', 'DESC']]
      });
      finalInstallmentNumber = lastInstallment ? lastInstallment.installment_number + 1 : 1;
    }

    // Create installment with initial payment flag
    const installment = await Installments.create({
      enrolledClientId,
      charge_type,
      amount,
      dueDate: is_initial_payment ? new Date() : dueDate, // Use current date for initial payment
      remark: is_initial_payment ? 'Initial Payment' : remark,
      installment_number: finalInstallmentNumber,
      paid: is_initial_payment, // Mark as paid if it's initial payment
      paidDate: is_initial_payment ? new Date() : null // Set paid date for initial payment
    });

    // Calculate new remaining amount after creating installment
    const newRemainingAmount = remainingAmount - amount;

    res.status(201).json({
      success: true,
      message: 'Installment created successfully',
      data: {
        installment,
        totalCharge,
        totalInstallments: totalInstallments + amount,
        remainingAmount: newRemainingAmount,
        needsMoreInstallments: newRemainingAmount > 0
      }
    });

  } catch (error) {
    console.error('Error creating installment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all installments for an enrolled client
export const getInstallmentsByEnrolledClient = async (req, res) => {
  try {
    const { enrolledClientId } = req.params;
    const { status, charge_type } = req.query; // 'paid', 'unpaid', or undefined for all

    let whereClause = { enrolledClientId };
    if (status === 'paid') {
      whereClause.paid = true;
    } else if (status === 'unpaid') {
      whereClause.paid = false;
    }
    if (charge_type) {
      whereClause.charge_type = charge_type;
    }

    const installments = await Installments.findAll({
      where: whereClause,
      order: [['installment_number', 'ASC']]
    });

    // Get remaining amount info
    const amountInfo = charge_type ? 
      await validateAndGetRemainingAmount(enrolledClientId, charge_type) :
      null;

    res.status(200).json({
      success: true,
      message: 'Installments retrieved successfully',
      data: {
        installments,
        ...(amountInfo && {
          totalCharge: amountInfo.totalCharge,
          totalInstallments: amountInfo.totalInstallments,
          remainingAmount: amountInfo.remainingAmount,
          needsMoreInstallments: amountInfo.remainingAmount > 0
        })
      }
    });

  } catch (error) {
    console.error('Error fetching installments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single installment by ID
export const getInstallmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Installment retrieved successfully',
      data: installment
    });

  } catch (error) {
    console.error('Error fetching installment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update installment
export const updateInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      dueDate,
      paid,
      paidDate,
      remark,
      installment_number
    } = req.body;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    // If installment number is being changed, check for conflicts
    if (installment_number && installment_number !== installment.installment_number) {
      const existingInstallment = await Installments.findOne({
        where: {
          enrolledClientId: installment.enrolledClientId,
          installment_number,
          id: { [Op.ne]: id } // Exclude current installment
        }
      });

      if (existingInstallment) {
        return res.status(400).json({
          success: false,
          message: `Installment number ${installment_number} already exists for this enrolled client`
        });
      }
    }

    // Update installment
    const updateData = {};
    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (paid !== undefined) {
      updateData.paid = paid;
      if (paid) {
        updateData.paidDate = paidDate || new Date();
      } else {
        updateData.paidDate = null;
      }
    }
    if (remark !== undefined) updateData.remark = remark;
    if (installment_number !== undefined) updateData.installment_number = installment_number;

    await installment.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Installment updated successfully',
      data: installment
    });

  } catch (error) {
    console.error('Error updating installment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete installment
export const deleteInstallment = async (req, res) => {
  try {
    const { id } = req.params;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    await installment.destroy();

    res.status(200).json({
      success: true,
      message: 'Installment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting installment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 