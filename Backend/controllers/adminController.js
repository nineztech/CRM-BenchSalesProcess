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

    // Compare password with hashed password stored
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Login successful
    res.status(200).json({ message: "Login successful", admin: { id: admin.id, username: admin.username, email: admin.email } });
  });
};

// Get all admins (for frontend to list)
exports.getAllAdmins = (req, res) => {

 const sql = `
  SELECT 
    id, first_name, last_name, email,username, mobile_number, 
    DATE_FORMAT(created_at, '%d/%m/%y %H:%i:%s') AS created_at 
  FROM admincreation 
  
`;


  connection.query(sql, (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};


// Use `connection` instead of `db` throughout

exports.updateAdmin = (req, res) => {
  const id = req.params.id;
  const {
    firstName,
    lastName,
    mobileNumber,
    username,
    email,
    password
  } = req.body;

  const updateFields = [
    firstName, lastName, mobileNumber, username, email
  ];

  const sql = `
    UPDATE usercreation SET 
      first_name = ?, last_name = ?, 
      mobile_number = ?, username = ?, email = ?
    ${password ? ', password = ?' : ''}
    WHERE id = ?
  `;

  if (password) {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: "Error hashing password" });
      db.query(sql, [...updateFields, hashedPassword, id], (err) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        res.status(200).json({ message: "User updated successfully" });
      });
    });
  } else {
    db.query(sql, [...updateFields, id], (err) => {
      if (err) return res.status(500).json({ message: "Error updating user" });
      res.status(200).json({ message: "User updated successfully" });
    });
  }
};

exports.deleteAdmin = (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM admincreation WHERE id = ?';

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting admin:", err);
      return res.status(500).json({ message: "Error deleting admin" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin deleted successfully" });
  });
};
