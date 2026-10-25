
const express = require("express");
const mongoose = require("mongoose");
const Certificate = require("../models/Certificate");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET: View certificates belonging to the logged-in student
router.get("/", authMiddleware, async (req, res) => {
  try {
    const certificates = await Certificate.find({
      studentId: req.studentId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error("Fetch certificates error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
    });
  }
});

// POST: Add a certificate
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, provider, certificateUrl, completionDate, status } =
      req.body;

    if (!title?.trim() || !provider?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Certificate title and provider are required",
      });
    }

    const certificate = await Certificate.create({
      studentId: req.studentId,
      title: title.trim(),
      provider: provider.trim(),
      certificateUrl: certificateUrl || "",
      completionDate: completionDate || null,
      status: status || "In Progress",
    });

    res.status(201).json({
      success: true,
      message: "Certificate added successfully",
      certificate,
    });
  } catch (error) {
    console.error("Add certificate error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add certificate",
    });
  }
});

// PUT: Update one of the logged-in student's certificates
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate ID",
      });
    }

    const allowedFields = [
      "title",
      "provider",
      "certificateUrl",
      "completionDate",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const certificate = await Certificate.findOneAndUpdate(
      {
        _id: req.params.id,
        studentId: req.studentId,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      message: "Certificate updated successfully",
      certificate,
    });
  } catch (error) {
    console.error("Update certificate error:", error.message);
    res.status(400).json({
      success: false,
      message: "Failed to update certificate",
    });
  }
});

// DELETE: Delete one of the logged-in student's certificates
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate ID",
      });
    }

    const certificate = await Certificate.findOneAndDelete({
      _id: req.params.id,
      studentId: req.studentId,
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Delete certificate error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete certificate",
    });
  }
});

module.exports = router;
