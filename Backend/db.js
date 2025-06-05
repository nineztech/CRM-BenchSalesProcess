const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root_123!',
  database: process.env.DB_NAME || 'crm_data',
   port: process.env.DB_PORT || 3307,
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

module.exports = db;
