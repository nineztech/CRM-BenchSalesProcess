import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

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

    const existingAdminByUsername = await User.findOne({ where: { username } });
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
      department: null,
      designation: null
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
    // Default pagination values
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Count total admins
    const { count, rows: admins } = await User.findAndCountAll({
      where: { role: 'admin' },
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']] // Optional: newest first
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: 'Admins fetched successfully',
      currentPage: page,
      totalPages,
      totalAdmins: count,
      data: admins
    });
  } catch (error) {
    console.error('Get Admins Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


