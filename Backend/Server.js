const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/Connection"); // correct import path

dotenv.config();

console.log("MongoDB URI from .env:", process.env.MONGODB_URI);


const app = express();
app.use(cors());
app.use(express.json());


connectDB();

 
app.get("/", (req, res) => {
  res.send("🚀 CRM Backend is running and connected to MongoDB Atlas!");
});

 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on ${PORT}`);
});
