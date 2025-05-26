const { insertUser } = require('../models/userModel');

exports.createUser = (req, res) => {
  const {
    firstName,
    lastName,
    department,
    designation,
    mobileNumber,
    email,
    username,
    password,
    confirmPassword
  } = req.body;

  insertUser(
    firstName,
    lastName,
    department,
    designation,
    mobileNumber,
    email,
    username,
    password,
    confirmPassword,
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ message: 'User created successfully', id: result.insertId });
    }
  );
};
