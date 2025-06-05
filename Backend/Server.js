import express from "express";
import cors from "cors";
import colors from "colors";
import dotenv from "dotenv";
import session from "express-session"; // Make sure this is installed
import { connectDB, sequelize } from "./config/dbConnection.js";
import router from "./Routes/index.js";
// import createDefaultUsers from "./DefaultData.js";

// Load environment variables
dotenv.config();

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
// app.use("/api/auth", authRoutes); // Add auth routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(colors.red("Error:"), err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 404 middleware for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Connect to MySQL Database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Sync Database with Models
    await sequelize.sync({force:true});
    console.log(colors.green("✅ Database & Tables Synced Successfully!"));
    
    // Start server
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