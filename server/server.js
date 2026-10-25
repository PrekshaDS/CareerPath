require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const careerRoutes = require("./routes/careerRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const app = express();
const PORT = 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use("/api/internships", internshipRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.get("/api/roadmap-test", (req, res) => {
  res.json({
    success: true,
    message: "Roadmap route is connected!"
  });
});
// HOME ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Career Guidance System API is running!"
  });
});

// STUDENT REGISTRATION AND LOGIN
app.use("/api/auth", authRoutes);

// EXISTING CAREER CRUD ROUTES
app.use("/api/careers", careerRoutes);

// CAREER ASSESSMENT ROUTES
app.use("/api/assessments", assessmentRoutes);

// HANDLE UNKNOWN ROUTES
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// CONNECT TO MONGODB AND START SERVER
mongoose
  .connect("mongodb://127.0.0.1:27017/career_guidance")
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
