const db = require('../db.js');

exports.insertAdmin = (
  firstName,
  lastName,
  mobileNumber,
  username,
  email,
  password,
  confirmPassword,
  callback
) => {
  const query = `
    INSERT INTO admincreation (first_name, last_name, mobile_number, username, email, password, confirm_password, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  db.query(
    query,
    [firstName, lastName, mobileNumber, username, email, password, confirmPassword],
    callback
  );
};
