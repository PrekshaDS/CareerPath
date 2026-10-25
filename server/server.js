
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
const opportunityRoutes = require("./routes/opportunityRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// HOME ROUTE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Career Guidance System API is running!",
  });
});

// STUDENT AUTHENTICATION
app.use("/api/auth", authRoutes);

// CAREER CRUD
app.use("/api/careers", careerRoutes);

// CAREER ASSESSMENT
app.use("/api/assessments", assessmentRoutes);

// INTERNSHIPS
app.use("/api/internships", internshipRoutes);

// CERTIFICATES
app.use("/api/certificates", certificateRoutes);

// LEARNING ROADMAP
app.use("/api/roadmap", roadmapRoutes);

// ROADMAP TEST
app.get("/api/roadmap-test", (req, res) => {
  res.json({
    success: true,
    message: "Roadmap route is connected!",
  });
});

// INTERNSHIP AND JOB OPPORTUNITIES
app.use("/api/opportunities", opportunityRoutes);

// OPPORTUNITY TEST
app.get("/api/opportunities-test", (req, res) => {
  res.json({
    success: true,
    message: "Opportunity route is connected!",
  });
});

// HANDLE UNKNOWN ROUTES — MUST REMAIN LAST
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// CONNECT TO MONGODB AND START SERVER
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/career_guidance"
  )
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        "Opportunities API: http://localhost:" + PORT + "/api/opportunities"
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
