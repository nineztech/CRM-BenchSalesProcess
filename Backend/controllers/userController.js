import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'; // Adjust path to your User model
import { Op } from 'sequelize';

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
      department,
      designation,
      phoneNumber,
      username
    } = req.body;

    // Validate input
    if (
      !email || !password || !firstname || !lastname ||
      !department || !designation || !phoneNumber || !username
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

    // Check for existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    // Check for existing username
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    // Create user
    const newUser = await User.create({
      email,
      password,
      firstname,
      lastname,
      department,
      designation,
      phoneNumber,
      username,
      role: 'user' // Optional, since default is already 'user'
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
          department: newUser.department,
          designation: newUser.designation,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token
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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
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
    const userId = req.user.userId; // Assuming middleware adds user to request

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'createdAt', 'updatedAt'] // Exclude password
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
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
        { department: { [Op.like]: `%${search}%` } }
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
        'department',
        'designation',
        'phoneNumber',
        'status',
        'createdAt',
        'updatedAt'
      ],
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