const express = require("express");
const Career = require("../models/Career");

const router = express.Router();

// GET ALL CAREERS
router.get("/", async (req, res) => {
  try {
    const careers = await Career.find().sort({ id: 1 });

    res.status(200).json({
      success: true,
      careers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET ONE CAREER
router.get("/:id", async (req, res) => {
  try {
    const career = await Career.findOne({
      id: Number(req.params.id)
    });

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found"
      });
    }

    res.status(200).json({
      success: true,
      career
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST - ADD CAREER
router.post("/", async (req, res) => {
  try {
    const { title, description, skills, salary, category } = req.body;

    if (!title || !description || !skills || !salary || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const lastCareer = await Career.findOne().sort({ id: -1 });
    const nextId = lastCareer ? lastCareer.id + 1 : 1;

    const newCareer = await Career.create({
      id: nextId,
      title,
      description,
      skills: Array.isArray(skills) ? skills : [skills],
      salary,
      category
    });

    res.status(201).json({
      success: true,
      message: "Career added successfully",
      career: newCareer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT - UPDATE CAREER
router.put("/:id", async (req, res) => {
  try {
    const career = await Career.findOneAndUpdate(
      { id: Number(req.params.id) },
      { $set: req.body },
      {
        new: true,
        runValidators: true
      }
    );

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Career updated successfully",
      career
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE CAREER
router.delete("/:id", async (req, res) => {
  try {
    const career = await Career.findOneAndDelete({
      id: Number(req.params.id)
    });

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "Career not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Career deleted successfully",
      career
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;