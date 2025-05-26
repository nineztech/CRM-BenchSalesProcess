const db = require('./db');

exports.insertUser = (
  firstName,
  lastName,
  department,
  designation,
  mobileNumber,
  email,
  username,
  password,
  confirmPassword,
  callback
) => {
  const query = `
    INSERT INTO usercreation (
      first_name, last_name, department, designation, mobile_number,
      email, username, password, confirm_password, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  db.query(
    query,
    [firstName, lastName, department, designation, mobileNumber, email, username, password, confirmPassword],
    callback
  );
};
