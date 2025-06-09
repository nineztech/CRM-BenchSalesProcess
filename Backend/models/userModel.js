const db = require('../db');

const createUserTable = () => {
  const sql = `
    CREATE TABLE usercreation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  department VARCHAR(100),
  designation VARCHAR(100),
  mobile_number VARCHAR(20),
  username VARCHAR(100) UNIQUE,
  email VARCHAR(100),
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); `;
  db.query(sql, (err) => {
    if (err) console.error('❌ Error creating table:', err.message);
    else console.log('✅ adddepartment table ready');
  });
};

 

// Insert new user
function insertUser(userData, callback) {
  const sql = `
    INSERT INTO usercreation (
      first_name, last_name, department, designation, 
      mobile_number, username, email, password
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    userData.firstName,
    userData.lastName,
    userData.department,
    userData.designation,
    userData.mobileNumber,
    userData.username,
    userData.email,
    userData.password
  ];

  db.query(sql, values, callback);
}

// Find user by username (for login)
function findUserByUsername(username, callback) {
  const sql = 'SELECT * FROM usercreation WHERE username = ?';
  db.query(sql, [username], callback);
}

module.exports = {
  insertUser,
  findUserByUsername,
  createUserTable
};
