const db = require('../db');

// Table creation logic
const createAdminTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS admincreation (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      mobile_number VARCHAR(20),
      username VARCHAR(50) UNIQUE,
      email VARCHAR(100) UNIQUE,
      password VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(sql, (err) => {
    if (err) console.error('❌ Error creating admincreation table:', err.message);
    else console.log('✅ admincreation table ready');
  });
};

// Insert admin - accepts individual params (consistent with controller)
const insertAdmin = (firstName, lastName, mobileNumber, username, email, hashedPassword, callback) => {
  const sql = `
    INSERT INTO admincreation 
    (first_name, last_name, mobile_number, username, email, password)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [firstName, lastName, mobileNumber, username, email, hashedPassword];

  db.query(sql, values, callback);
};

// Find admin by username for login
const findAdminByUsername = (username, callback) => {
  const sql = `SELECT * FROM admincreation WHERE username = ? LIMIT 1`;
  db.query(sql, [username], callback);
};

module.exports = { createAdminTable, insertAdmin, findAdminByUsername };
