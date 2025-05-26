const db = require('./db');

exports.insertDepartment = (departmentName, sequenceNumber, callback) => {
  const query = `INSERT INTO adddepartment (department_name, sequence_number, created_at)
                 VALUES (?, ?, NOW())`;
  db.query(query, [departmentName, sequenceNumber], callback);
};
