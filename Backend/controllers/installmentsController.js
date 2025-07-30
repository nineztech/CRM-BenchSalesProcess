import Installments from '../models/installmentsModel.js';
import EnrolledClients from '../models/enrolledClientsModel.js';
import Lead from '../models/leadModel.js';
import Packages from '../models/packagesModel.js';
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

// Create combined installments for offer letter and first year charges
export const createCombinedInstallments = async (req, res) => {
  try {
    const { enrolledClientId, offerLetterInstallments, firstYearInstallments } = req.body;

    // Validate enrolled client exists
    const enrolledClient = await EnrolledClients.findByPk(enrolledClientId);
    if (!enrolledClient) {
      return res.status(404).json({
        success: false,
        message: 'Enrolled client not found'
      });
    }

    // Validate offer letter charge
    if (enrolledClient.payable_offer_letter_charge && (!offerLetterInstallments || offerLetterInstallments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Offer letter installments are required when offer letter charge is set'
      });
    }

    // Validate first year charge
    if ((enrolledClient.payable_first_year_fixed_charge || enrolledClient.payable_first_year_percentage) && 
        (!firstYearInstallments || firstYearInstallments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'First year installments are required when first year charge is set'
      });
    }

    const createdInstallments = [];

    // Create offer letter installments
    if (offerLetterInstallments && offerLetterInstallments.length > 0) {
      const totalOfferLetterAmount = offerLetterInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      
      if (Math.abs(totalOfferLetterAmount - (enrolledClient.payable_offer_letter_charge || 0)) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Total offer letter installment amount (${totalOfferLetterAmount}) does not match the payable offer letter charge (${enrolledClient.payable_offer_letter_charge})`
        });
      }

      for (let i = 0; i < offerLetterInstallments.length; i++) {
        const installment = offerLetterInstallments[i];
        const createdInst = await Installments.create({
          enrolledClientId,
          charge_type: 'offer_letter_charge',
          amount: installment.amount,
          net_amount: installment.amount,
          dueDate: installment.dueDate,
          remark: installment.remark,
          installment_number: i,
          is_initial_payment: i === 0
        });
        createdInstallments.push(createdInst);
      }
    }

    // Create first year installments
    if (firstYearInstallments && firstYearInstallments.length > 0) {
      const totalFirstYearAmount = firstYearInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      const expectedFirstYearAmount = enrolledClient.net_payable_first_year_price || enrolledClient.payable_first_year_fixed_charge || 0;
      
      if (Math.abs(totalFirstYearAmount - expectedFirstYearAmount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Total first year installment amount (${totalFirstYearAmount}) does not match the expected first year amount (${expectedFirstYearAmount})`
        });
      }

      for (let i = 0; i < firstYearInstallments.length; i++) {
        const installment = firstYearInstallments[i];
        const createdInst = await Installments.create({
          enrolledClientId,
          charge_type: 'first_year_charge',
          amount: installment.amount,
          net_amount: installment.amount,
          dueDate: installment.dueDate,
          remark: installment.remark,
          installment_number: i,
          is_initial_payment: i === 0
        });
        createdInstallments.push(createdInst);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Combined installments created successfully',
      data: createdInstallments
    });

  } catch (error) {
    console.error('Error creating combined installments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
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

    // Determine if this is an initial payment based on installment_number
    const isInitialPayment = installment_number === 0 || is_initial_payment;

    // Skip remaining amount validation for initial payment that equals total charge
    if (!isInitialPayment && !(Math.abs(amount - totalCharge) < 0.01)) {
      // Calculate total of all installments including the new one
      const allInstallments = await Installments.findAll({
        where: { 
          enrolledClientId,
          charge_type,
          installment_number: { [Op.gt]: 0 } // Exclude initial payment
        }
      });
      
      const existingTotal = allInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
      const newTotal = existingTotal + Number(amount);

      // If new total exceeds total charge, reject
      if (Math.abs(newTotal - totalCharge) > 0.01 && newTotal > totalCharge) {
        return res.status(400).json({
          success: false,
          message: `Total installment amount (${newTotal}) exceeds the total charge (${totalCharge})`,
          data: {
            totalCharge,
            totalInstallments,
            remainingAmount
          }
        });
      }
    }

    // For initial payment, set installment_number to 0
    // For regular installments, auto-generate starting from 1 if not provided
    let finalInstallmentNumber;
    if (isInitialPayment) {
      finalInstallmentNumber = 0;
    } else if (!installment_number) {
      // Find the highest installment number excluding initial payment (0)
      const lastInstallment = await Installments.findOne({
        where: { 
          enrolledClientId,
          installment_number: { [Op.gt]: 0 } // Only look for numbers greater than 0
        },
        order: [['installment_number', 'DESC']]
      });
      finalInstallmentNumber = lastInstallment ? lastInstallment.installment_number + 1 : 1;
    } else {
      finalInstallmentNumber = installment_number;
    }

    // Check if installment number already exists for this enrolled client and charge_type
    if (!isInitialPayment) {  // Skip check for initial payment
      const existingInstallment = await Installments.findOne({
        where: {
          enrolledClientId,
          charge_type,
          installment_number: finalInstallmentNumber
        }
      });

      if (existingInstallment) {
        return res.status(400).json({
          success: false,
          message: `Installment number ${finalInstallmentNumber} already exists for this enrolled client and charge type`
        });
      }
    }

    // Get enrolled client to check approval status
    const enrolledClient = await EnrolledClients.findByPk(enrolledClientId);
    const isApproved = enrolledClient?.Approval_by_sales && enrolledClient?.Approval_by_admin;

    // Create installment with initial payment flag
    const installment = await Installments.create({
      enrolledClientId,
      charge_type,
      amount,
      net_amount: amount, // Set net_amount equal to amount by default
      dueDate: isInitialPayment ? new Date() : dueDate,
      remark: isInitialPayment ? 'Initial Payment' : remark,
      installment_number: finalInstallmentNumber,
      is_initial_payment: isInitialPayment,
      paid: isInitialPayment && isApproved && charge_type === 'enrollment_charge', // Only mark as paid if it's initial payment AND enrollment is approved AND it's enrollment charge
      paidDate: (isInitialPayment && isApproved && charge_type === 'enrollment_charge') ? new Date() : null // Only set paid date if it's initial payment AND enrollment is approved AND it's enrollment charge
    });

    // --- NEW LOGIC: If offer letter installment, send to admin for review ---
    if (charge_type === 'offer_letter_charge') {
      await EnrolledClients.update({
        offer_letter_approval_by_sales: true,
        offer_letter_approval_by_admin: false,
        offer_letter_has_update: true
      }, {
        where: { id: enrolledClientId }
      });
    }
    // --- END NEW LOGIC ---

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

    // Get enrolled client to check approval status and total amount
    const enrolledClient = await EnrolledClients.findByPk(installment.enrolledClientId);
    const isFullyApproved = enrolledClient?.Approval_by_sales && enrolledClient?.Approval_by_admin;

    // If amount is being updated, validate total amount
    if (amount !== undefined) {
      // Get all installments for this client except the current one
      const otherInstallments = await Installments.findAll({
        where: {
          enrolledClientId: installment.enrolledClientId,
          id: { [Op.ne]: id },
          charge_type: installment.charge_type
        }
      });

      // Calculate total amount including the new amount
      const totalAmount = otherInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0) + Number(amount);

      // Get the target amount based on charge type
      let targetAmount = 0;
      switch (installment.charge_type) {
        case 'enrollment_charge':
          targetAmount = enrolledClient.payable_enrollment_charge;
          break;
        case 'offer_letter_charge':
          targetAmount = enrolledClient.payable_offer_letter_charge;
          break;
        case 'first_year_charge':
          targetAmount = enrolledClient.payable_first_year_fixed_charge;
          break;
      }

      // Validate total amount
      // if (Math.abs(totalAmount - targetAmount) > 0.01) { // Using small epsilon for floating point comparison
      //   return res.status(400).json({
      //     success: false,
      //     message: `Total installment amount (${totalAmount}) must equal ${installment.charge_type} (${targetAmount})`
      //   });
      // }
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
    if (remark !== undefined) updateData.remark = remark;
    if (installment_number !== undefined) updateData.installment_number = installment_number;

    // Only set paid status for initial payment when fully approved (only for enrollment charge)
    if (installment.is_initial_payment) {
      updateData.paid = isFullyApproved && installment.charge_type === 'enrollment_charge';
      updateData.paidDate = (isFullyApproved && installment.charge_type === 'enrollment_charge') ? new Date() : null;
      updateData.paid_at = (isFullyApproved && installment.charge_type === 'enrollment_charge') ? new Date() : null;
    } else if (paid !== undefined) {
      updateData.paid = paid;
      updateData.paidDate = paid ? (paidDate || new Date()) : null;
      updateData.paid_at = paid ? new Date() : null;
    }

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

// Get all installments for payment control
export const getPaymentControlInstallments = async (req, res) => {
  try {
    const installments = await Installments.findAll({
      include: [
        {
          model: EnrolledClients,
          as: 'enrolledClient',
          include: [
            {
              model: Lead,
              as: 'lead',
              attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'technology', 'visaStatus']
            },
            {
              model: Packages,
              as: 'package',
              attributes: ['id', 'planName']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Payment control installments retrieved successfully',
      data: installments
    });

  } catch (error) {
    console.error('Error fetching payment control installments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paid, paidDate, updatedBy } = req.body;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    const updateData = {
      paid,
      paidDate: paid ? paidDate : null,
      paid_at: paid ? new Date() : null
    };

    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    await installment.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: installment
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update installment for payment control
export const updatePaymentControlInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { net_amount, paid, paidDate, remark, updatedBy } = req.body;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    const updateData = {
      net_amount: net_amount || installment.amount,
      paid,
      paidDate: paid ? paidDate : null,
      paid_at: paid ? new Date() : null,
      remark: remark || installment.remark
    };

    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

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

// Admin approval/rejection for installment
export const adminInstallmentApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      approved, 
      admin_id, 
      edited_amount,
      edited_dueDate,
      edited_remark,
      updatedBy 
    } = req.body;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Installment not found' 
      });
    }

    if (approved) {
      // Admin approves without changes
      await installment.update({
        admin_id,
        has_admin_update: false,
        edited_amount: installment.amount,
        edited_dueDate: installment.dueDate,
        edited_remark: installment.remark
      });
      // Sales approval will be handled automatically if admin approves without changes
      await installment.update({ sales_approval: true });
    } else {
      // Admin rejects/updates with changes
      const updateData = {
        admin_id,
        has_admin_update: true,
        sales_approval: false
      };

      // Add edited fields if provided
      if (edited_amount !== undefined) {
        updateData.edited_amount = edited_amount;
      }
      if (edited_dueDate !== undefined) {
        updateData.edited_dueDate = edited_dueDate;
      }
      if (edited_remark !== undefined) {
        updateData.edited_remark = edited_remark;
      }

      await installment.update(updateData);
    }

    res.status(200).json({
      success: true,
      message: approved ? 'Installment approved by admin' : 'Installment updated by admin',
      data: installment
    });

  } catch (error) {
    console.error('Error in admin installment approval action:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Sales approval/rejection for admin changes to installment
export const salesInstallmentApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, updatedBy } = req.body;

    const installment = await Installments.findByPk(id);
    if (!installment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Installment not found' 
      });
    }

    if (approved) {
      // Sales accepts admin changes
      await installment.update({
        sales_approval: true,
        has_admin_update: false,
        // Apply admin's edited values
        amount: installment.edited_amount || installment.amount,
        dueDate: installment.edited_dueDate || installment.dueDate,
        remark: installment.edited_remark || installment.remark,
        // Clear edited values
        edited_amount: null,
        edited_dueDate: null,
        edited_remark: null
      });
    } else {
      // Sales rejects admin changes
      await installment.update({
        sales_approval: false,
        has_admin_update: true,
        // Clear edited values
        edited_amount: null,
        edited_dueDate: null,
        edited_remark: null
      });
    }

    res.status(200).json({
      success: true,
      message: approved ? 'Admin changes to installment approved by sales' : 'Admin changes to installment rejected by sales',
      data: installment
    });

  } catch (error) {
    console.error('Error in sales installment approval action:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 