
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from the server .env file");
}

// Authenticate requests using the existing JWT token.
async function authenticateStudent(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.studentId = decoded.studentId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}

// Return only safe student fields.
function studentProfile(student) {
  return {
    id: student._id,
    name: student.name,
    email: student.email,
    targetCareer: student.targetCareer,
    skills: student.skills,
    interests: student.interests,
    semester: student.semester,
    bio: student.bio,
    college: student.college,
    github: student.github,
    linkedin: student.linkedin,
    createdAt: student.createdAt
  };
}

// STUDENT REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      targetCareer,
      semester
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingStudent = await Student.findOne({
      email: normalizedEmail
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const studentData = {
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12)
    };

    if (typeof targetCareer === "string" && targetCareer.trim()) {
      studentData.targetCareer = targetCareer.trim();
    }

    if (semester !== undefined && semester !== "") {
      const semesterNumber = Number(semester);

      if (
        !Number.isInteger(semesterNumber) ||
        semesterNumber < 1 ||
        semesterNumber > 12
      ) {
        return res.status(400).json({
          success: false,
          message: "Semester must be between 1 and 12"
        });
      }

      studentData.semester = semesterNumber;
    }

    const student = await Student.create(studentData);

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      student: studentProfile(student)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

// STUDENT LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const student = await Student.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (
      !student ||
      !(await bcrypt.compare(password, student.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { studentId: student._id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      student: studentProfile(student)
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

// GET THE LOGGED-IN STUDENT'S PROFILE
router.get("/me", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    return res.json({
      success: true,
      student: studentProfile(student)
    });
  } catch (error) {
    console.error("Profile fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch student profile"
    });
  }
});

// UPDATE THE LOGGED-IN STUDENT'S PROFILE
router.put("/me", authenticateStudent, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "targetCareer",
      "skills",
      "interests",
      "semester",
      "bio",
      "college",
      "github",
      "linkedin"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile fields were provided"
      });
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty"
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.targetCareer !== undefined) {
      if (typeof updates.targetCareer !== "string") {
        return res.status(400).json({
          success: false,
          message: "Target career must be text"
        });
      }

      updates.targetCareer = updates.targetCareer.trim();
    }

    if (updates.semester !== undefined) {
      const semesterNumber = Number(updates.semester);

      if (
        !Number.isInteger(semesterNumber) ||
        semesterNumber < 1 ||
        semesterNumber > 12
      ) {
        return res.status(400).json({
          success: false,
          message: "Semester must be between 1 and 12"
        });
      }

      updates.semester = semesterNumber;
    }

    for (const field of ["skills", "interests"]) {
      if (updates[field] !== undefined) {
        if (
          !Array.isArray(updates[field]) ||
          !updates[field].every(
            item => typeof item === "string"
          )
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be an array of text values`
          });
        }

        updates[field] = [
          ...new Set(
            updates[field]
              .map(item => item.trim())
              .filter(Boolean)
          )
        ];
      }
    }

    for (const field of [
      "bio",
      "college",
      "github",
      "linkedin"
    ]) {
      if (updates[field] !== undefined) {
        if (typeof updates[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be text`
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.studentId,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      student: studentProfile(student)
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Profile update failed"
    });
  }
});

module.exports = router;
