import User from '../models/userModel.js';
import Department from '../models/departmentModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const registerAdmin = async (req, res) => {
  try {  
    const { 
      email, 
      password, 
      firstname, 
      lastname, 
      phoneNumber, 
      username 
    } = req.body;

    if (!email || !password || !firstname || !lastname || !phoneNumber || !username) {
      return res.status(400).json({ 
        message: 'All fields are required', 
        required: ['email', 'password', 'firstname', 'lastname', 'phoneNumber', 'username']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (isNaN(phoneNumber) || phoneNumber.toString().length < 10) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const existingAdminByEmail = await User.findOne({ where: { email } });
    if (existingAdminByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingAdminByUsername = await User.findOne({ where: { username,role:"admin"} });
    if (existingAdminByUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const newAdmin = await User.create({ 
      email, 
      password, 
      firstname, 
      lastname, 
      phoneNumber, 
      username,
      role: 'admin',
      departmentId: null,
      subrole: null
    });

    const adminResponse = {
      id: newAdmin.id,
      email: newAdmin.email,
      firstname: newAdmin.firstname,
      lastname: newAdmin.lastname,
      phoneNumber: newAdmin.phoneNumber,
      username: newAdmin.username,
      role: newAdmin.role,
      createdAt: newAdmin.createdAt
    };

    res.status(201).json({ 
      message: 'Admin registered successfully', 
      admin: adminResponse 
    });

  } catch (error) {
    console.error('Admin Register Error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await User.findOne({ 
      where: { username, role: 'admin' },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['departmentName']
      }]
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userData = {
      id: admin.id,
      email: admin.email,
      firstname: admin.firstname,
      lastname: admin.lastname,
      phoneNumber: admin.phoneNumber,
      username: admin.username,
      role: admin.role,
      departmentId: admin.departmentId,
      subrole: admin.subrole,
      department: admin.department,
      status: admin.status,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    };

    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: userData
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: [
        'id',
        'email',
        'firstname',
        'lastname',
        'phoneNumber',
        'username',
        'role',
        'departmentId',
        'subrole',
        'status',
        'createdAt',
        'updatedAt'
      ],
      include: [{
        model: Department,
        as: 'department',
        attributes: ['departmentName']
      }],
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalPages = Math.ceil(totalAdmins / limit);

    res.status(200).json({
      success: true,
      message: 'Admins fetched successfully',
      currentPage: parseInt(page),
      totalPages,
      totalAdmins,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const editAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is required' });
    }

    // Get the fields from request body
    const updateFields = {};
    const allowedFields = ['email', 'firstname', 'lastname', 'phoneNumber', 'username', 'password', 'confirmPassword', 'departmentId', 'subrole'];

    // Add only the allowed fields that exist in the request
    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields[field] = req.body[field];
      }
    });

    // If no valid fields were provided
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    // Check if admin exists and get current admin
    const currentAdmin = await User.findByPk(id);
    if (!currentAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Handle password update if both password fields are provided
    if (updateFields.password && updateFields.confirmPassword) {
      // Validate password requirements
      if (!updateFields.password || updateFields.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      // Check if confirmPassword exists and matches
      if (!updateFields.confirmPassword || updateFields.password !== updateFields.confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      // Hash the new password
      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(updateFields.password, saltRounds);
        updateFields.password = hashedPassword;
        // Remove confirmPassword from update fields
        delete updateFields.confirmPassword;
      } catch (hashError) {
        console.error('Error hashing password:', hashError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error hashing password' 
        });
      }
    } else {
      // If no password update, remove password fields from update
      delete updateFields.password;
      delete updateFields.confirmPassword;
    }

    // Validate department and subrole if provided
    if (updateFields.departmentId || updateFields.subrole) {
      const department = await Department.findByPk(updateFields.departmentId);
      if (!department) {
        return res.status(400).json({ message: 'Invalid department' });
      }

      if (updateFields.subrole && !department.subroles.includes(updateFields.subrole)) {
        return res.status(400).json({ message: 'Invalid subrole for this department' });
      }
    }

    // Validate and update each field that exists in updateFields
    for (const field of Object.keys(updateFields)) {
      const value = updateFields[field];
      
      switch (field) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return res.status(400).json({ message: 'Invalid email format' });
          }

          const existingAdminByEmail = await User.findOne({
            where: { 
              email: value, 
              id: { [Op.ne]: id } 
            }
          });
          if (existingAdminByEmail) {
            return res.status(400).json({ message: 'Email already exists' });
          }
          break;

        case 'phoneNumber':
          if (isNaN(value) || value.toString().length < 10) {
            return res.status(400).json({ message: 'Invalid phone number' });
          }
          break;

        case 'username':
          const existingAdminByUsername = await User.findOne({
            where: { 
              username: value, 
              id: { [Op.ne]: id } 
            }
          });
          if (existingAdminByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          break;
      }
    }

    // Update admin data with the validated fields
    await currentAdmin.update(updateFields);

    // Prepare response data
    const updatedAdmin = {
      id: currentAdmin.id,
      email: currentAdmin.email,
      firstname: currentAdmin.firstname,
      lastname: currentAdmin.lastname,
      phoneNumber: currentAdmin.phoneNumber,
      username: currentAdmin.username,
      role: currentAdmin.role,
      departmentId: currentAdmin.departmentId,
      subrole: currentAdmin.subrole,
      createdAt: currentAdmin.createdAt,
      updatedAt: currentAdmin.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('Received request - ID:', id);
    console.log('Received status:', status);
    console.log('Params:', req.params);

    // Validate status value
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'inactive'"
      });
    }

    // Find the user
    const user = await User.findByPk(id);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the status
    await user.update({ status });

    res.status(200).json({
      success: true,
      message: `User status updated to ${status} successfully`,
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the admin
    const admin = await User.findOne({ 
      where: { 
        id,
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Instead of deleting, update status to inactive
    await admin.update({ 
      status: 'inactive'
    });

    res.status(200).json({
      success: true,
      message: 'Admin deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    // Since we're using JWT, we don't need to do anything server-side
    // The client will handle removing the token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send OTP for password reset
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing');
      return res.status(500).json({ message: 'Email service not configured' });
    }

    const user = await User.findOne({ where: { email, role: 'admin',status:"active" } });
    if (!user) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    // Save OTP and expiry to user record
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = expiry;
    await user.save();

    // Send email
    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}\nThis OTP will expire in 2 minutes.`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; padding: 15px !important; }
                  .content { padding: 20px !important; }
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #334155;">
              <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e2e8f0;">
                  <h1 style="margin: 0; color: #0369a1; font-size: 24px; font-weight: 600;">Password Reset</h1>
                </div>

                <!-- Content -->
                <div class="content" style="padding: 32px 40px; text-align: center;">
                  <p style="color: #334155; font-size: 16px; margin: 0;">Hello ${user.firstname},</p>
                  <p style="color: #64748b; font-size: 15px; margin: 24px 0;">You have requested to reset your password. Please use the verification code below:</p>
                  
                  <!-- OTP Display -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 32px 0;">
                    <div style="font-family: monospace; font-size: 32px; letter-spacing: 8px; color: #0369a1; font-weight: 600;">
                      ${otp}
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0 0;">This code will expire in 2 minutes</p>
                  </div>

                  <!-- Security Notice -->
                  <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                      If you didn't request this password reset, you can safely ignore this email. Your account security is important to us.
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                  <p style="color: #94a3b8; font-size: 14px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
                  <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">CRM Bench Sales Process Team</p>
                </div>
              </div>
            </body>
          </html>
        `
      });

      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Reset OTP in case of email failure
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiry = null;
      await user.save();
      return res.status(500).json({ 
        message: 'Failed to send OTP email',
        error: emailError.message 
      });
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({ message: 'No OTP was requested. Please request a new OTP.' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    if (new Date() > user.resetPasswordOtpExpiry) {
      // Clear expired OTP
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ 
      message: 'Failed to verify OTP',
      error: error.message 
    });
  }
};

// Reset password after OTP verification
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({ message: 'No OTP was requested. Please start the password reset process again.' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    if (new Date() > user.resetPasswordOtpExpiry) {
      // Clear expired OTP
      user.resetPasswordOtp = null;
      user.resetPasswordOtpExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Update password and clear OTP
    user.password = newPassword; // Will be hashed by model hook
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully! Please login with your new password.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ 
      message: 'Failed to reset password',
      error: error.message 
    });
  }
};
