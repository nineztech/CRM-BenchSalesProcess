import express from "express";
import cors from "cors";
import colors from "colors";
import dotenv from "dotenv";
import session from "express-session"; // optional
import { connectDB, sequelize } from "./config/dbConnection.js";
import router from "./Routes/index.js";

// Load environment variables
dotenv.config();

// Import models (this triggers model definitions + associations)
import "./models/index.js";  // ⬅️ This is IMPORTANT to register associations

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// Routes
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(colors.red("Error:"), err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Start server after DB connection
const startServer = async () => {
  try {
    await connectDB();

    // Ensure models and associations are synced
    await sequelize.sync({force:true}); // optionally: { force: false, alter: true }

    console.log(colors.green("✅ Database & Tables Synced Successfully!"));

    app.listen(PORT, () => {
      console.log(colors.cyan(`🚀 Server running on port ${PORT}`));
      console.log(colors.yellow(`📝 Environment: ${process.env.NODE_ENV || 'development'}`));
    });
  } catch (error) {
    console.error(colors.red("❌ Failed to start server:"), error);
    process.exit(1);
  }
};

startServer();
