console.log('Current dir:', __dirname);
console.log('Loading routes...');

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Correct paths
const adminRoutes = require("./Routes/adminRoutes.js");
const userRoutes = require('./Routes/userRoutes.js');
const departmentRoutes = require('./Routes/departmentRoutes.js');


app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
