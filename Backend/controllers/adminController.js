const { insertAdmin } = require('../models/adminModel');

exports.createAdmin = (req, res) => {
  const { firstName, lastName, mobileNumber, username, email, password,confirmPassword } = req.body;
  insertAdmin(firstName, lastName, mobileNumber, username, email, password,confirmPassword, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Admin created successfully', id: result.insertId });
  });
};