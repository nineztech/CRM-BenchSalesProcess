const { insertDepartment } = require('../models/departmentModel');

exports.createDepartment = (req, res) => {
  const { departmentName, sequenceNumber } = req.body;
  insertDepartment(departmentName, sequenceNumber, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Department added successfully', id: result.insertId });
  });
};
