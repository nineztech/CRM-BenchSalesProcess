const bcrypt = require('bcrypt');
const { insertUser, findUserByUsername } = require('../models/userModel');
const db = require('../db');

// Create user
exports.createUser = (req, res) => {
  const {
    firstName,
    lastName,
    department,
    designation,
    mobileNumber,
    username,
    email,
    password,
    confirmPassword
  } = req.body;

  if (
    !firstName || !lastName || !department || !designation ||
    !mobileNumber || !username || !email || !password || !confirmPassword
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("❌ Error hashing password:", err);
      return res.status(500).json({ message: "Server error" });
    }

    insertUser(
      {
        firstName,
        lastName,
        department,
        designation,
        mobileNumber,
        username,
        email,
        password: hashedPassword
      },
      (err, result) => {
        if (err) {
          console.error("❌ Error inserting user:", err.message);
          return res.status(500).json({ message: "Database error while creating user" });
        }

        res.status(201).json({ message: "User created successfully", id: result.insertId });
      }
    );
  });
};

// User login
exports.loginUser = (req, res) => {
  const { username, password } = req.body;

  findUserByUsername(username, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error during login" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  });
};

// Get all users
exports.getAllUsers = (req, res) => {
  const sql = `
  SELECT 
    id, first_name, last_name, email,username, mobile_number,department,
    designation, 
    DATE_FORMAT(created_at, '%d/%m/%y %H:%i:%s') AS created_at 
  FROM usercreation 
  LIMIT 0, 25
`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error while fetching users' });
    }
    res.json(results);
  });
};

// Update user
exports.updateUser = (req, res) => {
  const id = req.params.id;
  const {
    firstName,
    lastName,
    department,
    designation,
    mobileNumber,
    username,
    email,
    password
  } = req.body;

  const updateFields = [
    firstName, lastName, department, designation, mobileNumber, username, email
  ];

  const sql = `
    UPDATE usercreation SET 
      first_name = ?, last_name = ?, department = ?, designation = ?, 
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

// Delete user
exports.deleteUser = (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM usercreation WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting user" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  });
};
