const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database (your db.js should export and handle connection)
require('./db');

// Create tables if they don't exist
const { createAdminTable } = require('./models/adminModel');
const { createUserTable } = require('./models/userModel');
const { createDepartmentTable } = require('./models/departmentModel');

createAdminTable();
createUserTable();
createDepartmentTable();

// Middleware: enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

// Routes setup
app.use('/api/admin', require('./Routes/adminRoutes'));
app.use('/api/user', require('./Routes/userRoutes'));
app.use('/api/departments', require('./Routes/departmentRoutes'));

// Health check route (optional but useful)
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
