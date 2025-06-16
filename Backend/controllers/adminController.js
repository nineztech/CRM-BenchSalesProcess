import User from '../models/userModel.js';
import Department from '../models/departmentModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    const admin = await User.findOne({ where: { username, role: 'admin' } });

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

    res.status(200).json({ message: 'Login successful', token });
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