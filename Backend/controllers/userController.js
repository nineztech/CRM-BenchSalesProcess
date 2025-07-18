import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'; // Adjust path to your User model
import Department from '../models/departmentModel.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail, sendOtpEmail } from '../utils/emailService.js';
import RolePermission from '../models/rolePermissionModel.js';
import SpecialUserPermission from '../models/specialUserPermissionModel.js';

// Helper function to validate URLs
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstname,
      lastname,
      departmentId,
      subrole,
      phoneNumber,
      usphonenumber,
      linkedin,
      username,
      designation,
      is_special
    } = req.body;

    // Validate input
    if (
      !email || !password || !firstname || !lastname ||
      !departmentId || !subrole || !phoneNumber || !username || !designation
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Basic validations
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (isNaN(phoneNumber) || phoneNumber.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Validate US phone number if provided
    if (usphonenumber && (isNaN(usphonenumber) || usphonenumber.length < 10)) {
      return res.status(400).json({ success: false, message: 'Invalid US phone number' });
    }

    // Validate LinkedIn URL if provided
    if (linkedin && !isValidUrl(linkedin)) {
      return res.status(400).json({ success: false, message: 'Invalid LinkedIn URL' });
    }

    // Check for existing phone number across all users (including inactive users)
    const existingPhone = await User.findOne({
      where: { 
        phoneNumber
        // No role, status, or active/inactive filter to ensure complete uniqueness
      }
    });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    // Check for existing user with same email across all roles and statuses
    const existingUser = await User.findOne({ 
      where: { 
        email,
        // No role or status filter to check across all users
      } 
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    // Check for existing username across all roles and statuses
    const existingUsername = await User.findOne({ 
      where: { 
        username,
        // No role or status filter to check across all users
      } 
    });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Validate department and subrole
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }

    if (!department.subroles.includes(subrole)) {
      return res.status(400).json({ success: false, message: 'Invalid subrole for this department' });
    }

    // Create user with is_special as number
    const newUser = await User.create({
      email,
      password,
      firstname,
      lastname,
      departmentId,
      subrole,
      phoneNumber,
      usphonenumber,
      linkedin,
      username,
      designation,
      is_special: is_special ? 1 : 0, // Convert boolean to number
      role: 'user' // Optional, since default is already 'user'
    });

    // If user is special, create special user permissions
    if (is_special) {
      try {
        // Get all role permissions for the user's department and subrole
        const rolePermissions = await RolePermission.findAll({
          where: {
            dept_id: departmentId,
            subrole: subrole
          }
        });

        if (rolePermissions.length > 0) {
          // Create special user permissions based on role permissions
          await Promise.all(
            rolePermissions.map(async (rolePermission) => {
              return SpecialUserPermission.create({
                user_id: newUser.id,
                activity_id: rolePermission.activity_id,
                dept_id: rolePermission.dept_id,
                subrole: rolePermission.subrole,
                canView: rolePermission.canView,
                canAdd: rolePermission.canAdd,
                canEdit: rolePermission.canEdit,
                canDelete: rolePermission.canDelete,
                createdBy: req.user?.id
              });
            })
          );
        }
      } catch (error) {
        console.error("Error creating special user permissions:", error);
        // Don't fail the user creation if permissions creation fails
      }
    }

    // Send welcome email
    const emailSent = await sendWelcomeEmail({
      email,
      username,
      password, // Send the plain password before it's hashed
      firstname,
      lastname
    });

    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          departmentId: newUser.departmentId,
          subrole: newUser.subrole,
          phoneNumber: newUser.phoneNumber,
          designation: newUser.designation,
          role: newUser.role,
          is_special: Boolean(newUser.is_special), // Convert back to boolean for response
          createdAt: newUser.createdAt
        },
        token,
        emailSent
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username with department info
    const user = await User.findOne({ 
      where: { username },
      include: [{
        model: Department,
        as: 'userDepartment',
        attributes: ['departmentName']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      phoneNumber: user.phoneNumber,
      usphonenumber: user.usphonenumber,
      linkedin: user.linkedin,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
      subrole: user.subrole,
      department: user.userDepartment,
      designation:user.designation,
      status: user.status,
      is_special: user.is_special,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile (requires authentication)
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      include: [{
        model: Department,
        as: 'userDepartment',
        attributes: ['departmentName']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      phoneNumber: user.phoneNumber,
      usphonenumber: user.usphonenumber,
      linkedin: user.linkedin,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
      subrole: user.subrole,
      department: user.userDepartment,
      status: user.status,
      is_special: user.is_special,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      data: { user: userData }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user (if using token blacklisting)
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from storage
    // If you need server-side logout, implement token blacklisting
    
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

export const updateOwnStatus = async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from authenticated request
    const { status } = req.body;

    // Only allow deactivation (users cannot reactivate themselves)
    if (status !== 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Users can only deactivate their account. Contact an administrator for reactivation.'
      });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin users from deactivating themselves through this endpoint
    if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'masteradmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot deactivate their account through this endpoint'
      });
    }

    // Update the status
    await user.update({ status: 'inactive' });

    res.status(200).json({
      success: true,
      message: 'Your account has been deactivated successfully',
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update own status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user status
export const getOwnStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'status', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status
    } = req.query;

    // Build where clause
    const whereClause = {
      role: 'user'  // Only get users with role 'user'
    };

    // Add status filter if provided
    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstname: { [Op.like]: `%${search}%` } },
        { lastname: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { subrole: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 
        'email', 
        'firstname', 
        'lastname', 
        'username',
        'departmentId',
        'subrole',
        'phoneNumber',
        'usphonenumber',
        'linkedin',
        'designation',
        'status',
        'is_special',
        'createdAt',
        'updatedAt'
      ],
      include: [{
        model: Department,
        as: 'userDepartment',
        attributes: ['departmentName']
      }],
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: parseInt(limit)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(users.count / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          totalPages,
          currentPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUsersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { 
      page = 1, 
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status
    } = req.query;

    // Build where clause
    const whereClause = {
      departmentId,
      role: 'user'  // Only get users with role 'user'
    };

    // Add status filter if provided
    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstname: { [Op.like]: `%${search}%` } },
        { lastname: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { subrole: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 
        'email', 
        'firstname', 
        'lastname', 
        'username',
        'departmentId',
        'subrole',
        'phoneNumber',
        'status',
        'is_special',
        'createdAt',
        'updatedAt'
      ],
      include: [{
        model: Department,
        as: 'userDepartment',
        attributes: ['departmentName']
      }],
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: parseInt(limit)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(users.count / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          totalPages,
          currentPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findOne({ 
      where: { 
        id,
        role: 'user'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Instead of deleting, update status to inactive
    await user.update({ 
      status: 'inactive'
    });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if request body exists
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is required' });
    }

    // Get the fields from request body
    const updateFields = {};
    const allowedFields = ['email', 'firstname', 'lastname', 'phoneNumber', 'usphonenumber', 'linkedin', 'username', 'password', 'confirmPassword', 'departmentId', 'subrole', 'designation', 'is_special'];

    // Add only the allowed fields that exist in the request
    Object.keys(req.body).forEach(field => {
      if (allowedFields.includes(field)) {
        // Convert is_special to boolean if it exists
        if (field === 'is_special') {
          updateFields[field] = Boolean(req.body[field]);
        } else {
          updateFields[field] = req.body[field];
        }
      }
    });

    // If no valid fields were provided
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    // Check if user exists and get current user
    const currentUser = await User.findByPk(id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is actually a user (not admin)
    if (currentUser.role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'User is not a regular user'
      });
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

          const existingUserByEmail = await User.findOne({
            where: { 
              email: value, 
              id: { [Op.ne]: id }
              // No role or status filter to check across all users
            }
          });
          if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email already exists' });
          }
          break;

        case 'phoneNumber':
          if (isNaN(value) || value.toString().length < 10) {
            return res.status(400).json({ message: 'Invalid phone number' });
          }
          
          // Check phone number uniqueness across all users (including inactive)
          const existingUserByPhone = await User.findOne({
            where: { 
              phoneNumber: value, 
              id: { [Op.ne]: id }
              // No role, status, or active/inactive filter to ensure complete uniqueness
            }
          });
          if (existingUserByPhone) {
            return res.status(400).json({ message: 'Phone number already registered' });
          }
          break;

        case 'usphonenumber':
          if (value && (isNaN(value) || value.toString().length < 10)) {
            return res.status(400).json({ message: 'Invalid US phone number' });
          }
          break;

        case 'linkedin':
          if (value && !isValidUrl(value)) {
            return res.status(400).json({ message: 'Invalid LinkedIn URL' });
          }
          break;

        case 'username':
          const existingUserByUsername = await User.findOne({
            where: { 
              username: value, 
              id: { [Op.ne]: id }
              // No role or status filter to check across all users
            }
          });
          if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          break;
      }
    }

    // Update user data with the validated fields
    await currentUser.update(updateFields);

    // Prepare response data
    const updatedUser = {
      id: currentUser.id,
      email: currentUser.email,
      firstname: currentUser.firstname,
      lastname: currentUser.lastname,
      phoneNumber: currentUser.phoneNumber,
      usphonenumber: currentUser.usphonenumber,
      linkedin: currentUser.linkedin,
      username: currentUser.username,
      role: currentUser.role,
      departmentId: currentUser.departmentId,
      subrole: currentUser.subrole,
      status: currentUser.status,
      is_special: currentUser.is_special,
      createdAt: currentUser.createdAt,
      updatedAt: currentUser.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email (both admin and regular users)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry

    // Save OTP and expiry to user record
    await user.update({
      resetPasswordOtp: otp,
      resetPasswordOtpExpiry: otpExpiry
    });

    // Send OTP email
    const emailSent = await sendOtpEmail({
      email,
      otp,
      firstname: user.firstname
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user by email (both admin and regular users)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found'
      });
    }

    if (new Date() > new Date(user.resetPasswordOtpExpiry)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (user.resetPasswordOtp !== otp) {
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
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Find user by email (both admin and regular users)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP again
    if (
      !user.resetPasswordOtp ||
      !user.resetPasswordOtpExpiry ||
      user.resetPasswordOtp !== otp ||
      new Date() > new Date(user.resetPasswordOtpExpiry)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Update password and clear OTP fields
    await user.update({
      password: newPassword,
      resetPasswordOtp: null,
      resetPasswordOtpExpiry: null
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
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

    // Validate status
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be either "active" or "inactive"'
      });
    }

    // Find the user
    const user = await User.findOne({ 
      where: { 
        id,
        role: 'user' // Ensure we're only updating regular users
      }
    });

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
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
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

export const toggleSpecialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_special } = req.body;

    // Validate is_special
    if (typeof is_special !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid is_special value. Must be a boolean'
      });
    }

    // Find the user
    const user = await User.findOne({ 
      where: { 
        id,
        role: 'user' // Ensure we're only updating regular users
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the special status
    await user.update({ is_special });

    res.status(200).json({
      success: true,
      message: `User special status ${is_special ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: user.id,
        email: user.email,
        is_special: user.is_special,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Toggle special status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getSpecialUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status
    } = req.query;

    // Build where clause
    const whereClause = {
      role: 'user',  // Only get users with role 'user'
      is_special: true // Only get special users
    };

    // Add status filter if provided
    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { firstname: { [Op.like]: `%${search}%` } },
        { lastname: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { subrole: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get special users with pagination
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 
        'email', 
        'firstname', 
        'lastname', 
        'username',
        'departmentId',
        'subrole',
        'phoneNumber',
        'designation',
        'status',
        'is_special',
        'createdAt',
        'updatedAt'
      ],
      include: [{
        model: Department,
        as: 'userDepartment',
        attributes: ['departmentName']
      }],
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: parseInt(limit)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(users.count / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      message: 'Special users fetched successfully',
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          totalPages,
          currentPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get special users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Team Lead users from sales departments
export const getTeamLeadUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status = 'active'
    } = req.query;

    // First, get all sales departments
    const salesDepartments = await Department.findAll({
      where: {
        isSalesTeam: true,
        status: 'active'
      },
      attributes: ['id', 'departmentName', 'subroles']
    });

    // Extract department IDs and find exact "Team Lead" subroles
    const departmentIds = salesDepartments.map(dept => dept.id);
    const teamLeadSubroles = salesDepartments.reduce((acc, dept) => {
      const teamLeadRoles = dept.subroles.filter(role => role === 'Team Lead');
      return [...acc, ...teamLeadRoles];
    }, []);

    if (departmentIds.length === 0 || teamLeadSubroles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No sales departments or team lead roles found',
        data: {
          users: [],
          pagination: {
            total: 0,
            totalPages: 0,
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    }

    // Build where clause
    const whereClause = {
      role: 'user',
      departmentId: {
        [Op.in]: departmentIds
      },
      subrole: 'Team Lead', // Exact match for "Team Lead"
      status: status && ['active', 'inactive'].includes(status) ? status : 'active'
    };

    // Add search functionality
    if (search) {
      whereClause[Op.and] = [
        whereClause,
        {
          [Op.or]: [
            { email: { [Op.like]: `%${search}%` } },
            { firstname: { [Op.like]: `%${search}%` } },
            { lastname: { [Op.like]: `%${search}%` } },
            { username: { [Op.like]: `%${search}%` } }
          ]
        }
      ];
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get team lead users with pagination
    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 
        'email', 
        'firstname', 
        'lastname', 
        'username',
        'departmentId',
        'subrole',
        'phoneNumber',
        'designation',
        'status',
        'is_special',
        'createdAt',
        'updatedAt'
      ],
      include: [{
        model: Department,
        as: 'userDepartment',
        attributes: ['departmentName', 'isSalesTeam']
      }],
      order: [[sortBy, sortOrder]],
      offset: offset,
      limit: parseInt(limit)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(users.count / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      message: 'Team Lead users fetched successfully',
      data: {
        users: users.rows,
        pagination: {
          total: users.count,
          totalPages,
          currentPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Team Lead users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};