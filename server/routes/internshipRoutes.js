
const express = require("express");
const mongoose = require("mongoose");
const Internship = require("../models/Internship");

const router = express.Router();

// GET: List internships with search and filters
router.get("/", async (req, res) => {
  try {
    const { search, mode, category } = req.query;

    const filter = { active: true };

    if (search && search.trim()) {
      const safeSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } },
        { skills: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (mode && ["Remote", "Hybrid", "On-site"].includes(mode)) {
      filter.mode = mode;
    }

    if (category && category.trim()) {
      filter.category = category.trim();
    }

    const internships = await Internship.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      count: internships.length,
      internships,
    });
  } catch (error) {
    console.error("Fetch internships error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch internships.",
    });
  }
});

// GET: Fetch one internship by MongoDB ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid internship ID.",
      });
    }

    const internship = await Internship.findOne({
      _id: req.params.id,
      active: true,
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found.",
      });
    }

    return res.json({
      success: true,
      internship,
    });
  } catch (error) {
    console.error("Fetch internship error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch internship.",
    });
  }
});

module.exports = router;
