import express from "express";
import cors from "cors";
import colors from "colors";
import dotenv from "dotenv";
import session from "express-session"; // optional
import { connectDB, sequelize } from "./config/dbConnection.js";
import router from "./Routes/index.js";
import addOtpFields from './migrations/addOtpFields.js';
import { createDefaultActivities } from './controllers/activityController.js';
import emailRoutes from './Routes/emailRoutes.js';
import bulkRoutes from './Routes/bulkRoutes.js';
import { createLeadIndex } from './config/elasticSearch.js';
import { reindexLeads } from './scripts/indexLeads.js';

// Load environment variables
dotenv.config();

// Import models (this triggers model definitions + associations)
import "./models/index.js";  // ⬅️ This is IMPORTANT to register associations

// Import the syncModels function
import { syncModels } from './models/index.js';

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [process.env.USER_URL, process.env.ADMIN_URL],
  credentials: true,
}));

// Routes
app.use("/api", router);
app.use('/api/email', emailRoutes);
app.use('/api/bulk', bulkRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(colors.red("Error:"), err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// Start server after DB connection
const startServer = async () => {
  try {
    await connectDB();

    // Use the new syncModels function instead of sequelize.sync()
    await syncModels();

    console.log(colors.green("✅ Database & Tables Synced Successfully!"));

    // Initialize Elasticsearch (non-blocking)
    try {
      await createLeadIndex();
       await reindexLeads();
      console.log(colors.green("✅ Elasticsearch index created successfully!"));
    } catch (error) {
      console.warn(colors.yellow("⚠️ Elasticsearch initialization failed. The application will continue without search functionality."));
      console.error(colors.red("Elasticsearch Error:"), error.message);
    }

    // After database connection is established
    sequelize.authenticate()
      .then(() => {
        console.log('✅ MySQL Database Connected Successfully!');
        // Sync all models with alter: false to prevent automatic table alterations
        return sequelize.sync({ alter: true });
      })
      .then(() => {
        // Run OTP fields migration
        return addOtpFields();
      })
      .then(async () => {
        // Create default activities
        await createDefaultActivities();
        console.log(colors.green("✅ Default activities created successfully!"));
        
        app.listen(PORT, () => {
          console.log(colors.cyan(`🚀 Server running on port ${PORT}`));
          console.log(colors.yellow(`📝 Environment: ${process.env.NODE_ENV || 'development'}`));
        });
      })
      .catch((error) => {
        console.error('❌ Unable to connect to the database:', error);
      });
  } catch (error) {
    console.error(colors.red("❌ Failed to start server:"), error);
    process.exit(1);
  }
};

startServer();
