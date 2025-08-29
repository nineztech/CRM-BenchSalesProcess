import ClientUser from '../models/clientUserModel.js';
import Lead from '../models/leadModel.js';
import EnrolledClients from '../models/enrolledClientsModel.js';
import { Op } from 'sequelize';
import { sendClientWelcomeEmail, sendChangePasswordOtpEmail } from '../utils/emailService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Generate random password
const generateRandomPassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create client user automatically when client is approved
export const createClientUser = async (enrolledClientId) => {
  try {
    const enrolledClient = await EnrolledClients.findOne({
      where: {
        id: enrolledClientId,
        Approval_by_sales: true,
        Approval_by_admin: true
      },
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'emails', 'contactNumbers', 'linkedinId', 'technology', 'country', 'countryCode', 'visaStatus']
        }
      ]
    });

    if (!enrolledClient || !enrolledClient.lead) {
      throw new Error('Enrolled client or lead not found');
    }

    // Check if client user already exists
    const existingUser = await ClientUser.findOne({
      where: {
        [Op.or]: [
          { lead_id: enrolledClient.lead.id },
          { enrolled_client_id: enrolledClient.id }
        ]
      }
    });

    if (existingUser) {
      throw new Error('Client user already exists');
    }

    // Generate username and password
    const username = `${enrolledClient.lead.firstName.toLowerCase()}_${enrolledClient.lead.lastName.toLowerCase()}`;
    const password = generateRandomPassword();

    // Create client user
    const clientUser = await ClientUser.create({
      lead_id: enrolledClient.lead.id,
      enrolled_client_id: enrolledClient.id,
      firstName: enrolledClient.lead.firstName,
      lastName: enrolledClient.lead.lastName,
      username,
      password,
      contactNumbers: enrolledClient.lead.contactNumbers,
      emails: enrolledClient.lead.emails,
      linkedinId: enrolledClient.lead.linkedinId,
      technology: enrolledClient.lead.technology,
      country: enrolledClient.lead.country,
      countryCode: enrolledClient.lead.countryCode,
      visaStatus: enrolledClient.lead.visaStatus,
      createdBy: enrolledClient.Admin_id || enrolledClient.Sales_person_id
    });

    // Send welcome email with credentials
    try {
      await sendClientWelcomeEmail({
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        username: username,
        password: password,
        primaryEmail: clientUser.primaryEmail
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't throw error here as user creation was successful
    }

    // Return the client user with the plain password for email notification
    return {
      clientUser,
      plainPassword: password
    };

  } catch (error) {
    console.error('Error creating client user:', error);
    throw error;
  }
};

// Get all client users
export const getAllClientUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } },
          { primaryEmail: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const clientUsers = await ClientUser.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: 'Client users retrieved successfully',
      data: clientUsers.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(clientUsers.count / limit),
        totalItems: clientUsers.count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching client users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get client user by ID
export const getClientUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const clientUser = await ClientUser.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'Client user not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client user retrieved successfully',
      data: clientUser
    });

  } catch (error) {
    console.error('Error fetching client user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update client user
export const updateClientUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.username;
    delete updateData.lead_id;
    delete updateData.enrolled_client_id;

    const clientUser = await ClientUser.findByPk(id);
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'Client user not found'
      });
    }

    await clientUser.update({
      ...updateData,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Client user updated successfully',
      data: clientUser
    });

  } catch (error) {
    console.error('Error updating client user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reset client user password
export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const newPassword = generateRandomPassword();

    const clientUser = await ClientUser.findByPk(id);
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'Client user not found'
      });
    }

    await clientUser.update({
      password: newPassword,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        username: clientUser.username,
        newPassword: newPassword
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle client user active status
export const toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const clientUser = await ClientUser.findByPk(id);
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'Client user not found'
      });
    }

    await clientUser.update({
      isActive: !clientUser.isActive,
      updatedBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: `Client user ${clientUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: clientUser
    });

  } catch (error) {
    console.error('Error toggling active status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Client user login
export const loginClientUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const clientUser = await ClientUser.findOne({ where: { username } });
    if (!clientUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!clientUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    const isMatch = await clientUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: clientUser.id, 
        username: clientUser.username,
        type: 'client' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await clientUser.update({
      lastLogin: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: clientUser.id,
          email: clientUser.primaryEmail,
          username: clientUser.username,
          role: 'client',
          subrole: 'client',
          departmentId: null,
          designation: 'Client',
          status: 'active',
          is_special: false,
          isFirstLogin: clientUser.isFirstLogin,
          createdAt: clientUser.createdAt,
          updatedAt: clientUser.updatedAt,
          department: null
        },
        token: token
      }
    });

  } catch (error) {
    console.error('Error in client user login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Generate OTP for change password
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP for change password
export const sendChangePasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const clientUser = await ClientUser.findOne({ where: { primaryEmail: email } });
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await clientUser.update({
      changePasswordOtp: otp,
      changePasswordOtpExpiry: otpExpiry
    });

    // Send OTP email
    try {
      await sendChangePasswordOtpEmail({
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        email: clientUser.primaryEmail,
        otp: otp
      });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('Error sending change password OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify OTP for change password
export const verifyChangePasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const clientUser = await ClientUser.findOne({ where: { primaryEmail: email } });
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if OTP exists and is not expired
    if (!clientUser.changePasswordOtp || !clientUser.changePasswordOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    if (new Date() > clientUser.changePasswordOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (clientUser.changePasswordOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Error verifying change password OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const clientUser = await ClientUser.findOne({ where: { primaryEmail: email } });
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Verify OTP again
    if (!clientUser.changePasswordOtp || !clientUser.changePasswordOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    if (new Date() > clientUser.changePasswordOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (clientUser.changePasswordOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Hash the new password before updating
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear OTP
    await clientUser.update({
      password: hashedPassword,
      changePasswordOtp: null,
      changePasswordOtpExpiry: null,
      isFirstLogin: false
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 