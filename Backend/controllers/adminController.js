const bcrypt = require('bcrypt');
const connection = require('../db');
const { insertAdmin, findAdminByUsername } = require('../models/adminModel');

// Create a new admin with hashed password
exports.createAdmin = async (req, res) => {
  const {
    firstName,
    lastName,
    mobileNumber,
    username,
    email,
    password,
    confirmPassword,
  } = req.body;

  // Validate passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB using the model function
    insertAdmin(firstName, lastName, mobileNumber, username, email, hashedPassword, (err, result) => {
      if (err) {
        console.error("Database insert error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ message: "Admin created successfully", id: result.insertId });
    });
  } catch (error) {
    console.error("Password hashing error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Login admin by username and password
exports.loginAdmin = (req, res) => {
  const { username, password } = req.body;

  // Find admin by username
  findAdminByUsername(username, async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const admin = results[0];

    // Check if admin is disabled
    if (admin.is_disabled) {
      return res.status(401).json({ error: "Account is disabled" });
    }

    // Compare password with hashed password stored
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Login successful
    res.status(200).json({ 
      message: "Login successful", 
      admin: { 
        id: admin.id, 
        username: admin.username, 
        email: admin.email 
      } 
    });
  });
};

// Get all admins (for frontend to list)
exports.getAllAdmins = (req, res) => {
  const sql = `
    SELECT 
      id, first_name, last_name, email, username, mobile_number, 
      is_disabled,
      DATE_FORMAT(created_at, '%d/%m/%y %H:%i:%s') AS created_at 
    FROM admincreation 
    ORDER BY created_at DESC
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Update admin - FIXED VERSION
exports.updateAdmin = async (req, res) => {
  const id = req.params.id;
  const {
    firstName,
    lastName,
    mobileNumber,
    username,
    email,
    password
  } = req.body;

  try {
    let sql, values;

    if (password && password.trim() !== '') {
      // Hash new password if provided
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = `
        UPDATE admincreation SET 
          first_name = ?, last_name = ?, 
          mobile_number = ?, email = ?, password = ?
        WHERE id = ?
      `;
      values = [firstName, lastName, mobileNumber, email, hashedPassword, id];
    } else {
      // Update without password
      sql = `
        UPDATE admincreation SET 
          first_name = ?, last_name = ?, 
          mobile_number = ?, email = ?
        WHERE id = ?
      `;
      values = [firstName, lastName, mobileNumber, email, id];
    }

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error updating admin:", err);
        return res.status(500).json({ message: "Error updating admin" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.status(200).json({ message: "Admin updated successfully" });
    });

  } catch (error) {
    console.error("Error in updateAdmin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle admin status (disable/enable instead of delete)
exports.toggleAdminStatus = (req, res) => {
  const id = req.params.id;
  
  // First get current status
  const getCurrentStatusSql = 'SELECT is_disabled FROM admincreation WHERE id = ?';
  
  connection.query(getCurrentStatusSql, [id], (err, results) => {
    if (err) {
      console.error("Error getting admin status:", err);
      return res.status(500).json({ message: "Error getting admin status" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    const currentStatus = results[0].is_disabled;
    const newStatus = !currentStatus;
    
    // Update the status
    const updateSql = 'UPDATE admincreation SET is_disabled = ? WHERE id = ?';
    
    connection.query(updateSql, [newStatus, id], (err, result) => {
      if (err) {
        console.error("Error updating admin status:", err);
        return res.status(500).json({ message: "Error updating admin status" });
      }
      
      const statusText = newStatus ? "disabled" : "enabled";
      res.status(200).json({ 
        message: `Admin ${statusText} successfully`,
        is_disabled: newStatus
      });
    });
  });
};

 