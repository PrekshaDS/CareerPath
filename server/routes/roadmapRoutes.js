
const express = require("express");
const mongoose = require("mongoose");
const Roadmap = require("../models/Roadmap");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET: View the logged-in student's roadmap
router.get("/", authMiddleware, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      studentId: req.studentId,
    });

    res.json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error("Fetch roadmap error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap",
    });
  }
});

// POST: Create or replace the student's roadmap
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { targetCareer, steps } = req.body;

    if (!targetCareer?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Target career is required",
      });
    }

    if (steps !== undefined && !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        message: "Steps must be an array",
      });
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      { studentId: req.studentId },
      {
        $set: {
          targetCareer: targetCareer.trim(),
          ...(steps !== undefined ? { steps } : {}),
        },
        $setOnInsert: {
          studentId: req.studentId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Roadmap saved successfully",
      roadmap,
    });
  } catch (error) {
    console.error("Save roadmap error:", error.message);
    res.status(400).json({
      success: false,
      message: "Failed to save roadmap",
    });
  }
});

// PATCH: Update one roadmap step's completion status
router.patch("/steps/:stepId", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.stepId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid step ID",
      });
    }

    if (typeof req.body.completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "completed must be true or false",
      });
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      {
        studentId: req.studentId,
        "steps._id": req.params.stepId,
      },
      {
        $set: {
          "steps.$.completed": req.body.completed,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap or step not found",
      });
    }

    res.json({
      success: true,
      message: "Roadmap step updated successfully",
      roadmap,
    });
  } catch (error) {
    console.error("Update roadmap step error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update roadmap step",
    });
  }
});

// DELETE: Delete the logged-in student's roadmap
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({
      studentId: req.studentId,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found",
      });
    }

    res.json({
      success: true,
      message: "Roadmap deleted successfully",
    });
  } catch (error) {
    console.error("Delete roadmap error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete roadmap",
    });
  }
});

module.exports = router;
