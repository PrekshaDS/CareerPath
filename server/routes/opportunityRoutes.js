
const express = require("express");
const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");

const router = express.Router();

const allowedTypes = [
  "Internship",
  "Full-time",
  "Part-time",
  "Remote Internship",
];

const allowedModes = ["On-site", "Hybrid", "Remote"];
const allowedStatuses = ["Active", "Closed"];

function validateOpportunity(body = {}) {
  const requiredFields = [
    "title",
    "company",
    "location",
    "description",
    "applicationUrl",
  ];

  for (const field of requiredFields) {
    if (!String(body[field] || "").trim()) {
      return `${field} is required.`;
    }
  }

  if (body.type && !allowedTypes.includes(body.type)) {
    return "Invalid opportunity type.";
  }

  if (body.mode && !allowedModes.includes(body.mode)) {
    return "Invalid work mode.";
  }

  if (body.status && !allowedStatuses.includes(body.status)) {
    return "Invalid opportunity status.";
  }

  try {
    const url = new URL(body.applicationUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "Application URL must use HTTP or HTTPS.";
    }
  } catch {
    return "Enter a valid application URL, including https://.";
  }

  if (
    body.deadline &&
    Number.isNaN(new Date(body.deadline).getTime())
  ) {
    return "Enter a valid application deadline.";
  }

  if (body.skills !== undefined && !Array.isArray(body.skills) &&
      typeof body.skills !== "string") {
    return "Skills must be a comma-separated string or an array.";
  }

  return null;
}

function makePayload(body) {
  return {
    title: String(body.title || "").trim(),
    company: String(body.company || "").trim(),
    type: body.type || "Internship",
    location: String(body.location || "").trim(),
    mode: body.mode || "On-site",
    description: String(body.description || "").trim(),

    skills: Array.isArray(body.skills)
      ? body.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : String(body.skills || "")
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),

    stipend: String(body.stipend || "Not specified").trim(),
    eligibility: String(
      body.eligibility || "Check the employer's requirements"
    ).trim(),

    applicationUrl: String(body.applicationUrl || "").trim(),
    deadline: body.deadline || null,
    status: body.status || "Active",
  };
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/opportunities
// Supports search, type, mode and status filters.
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      type = "All",
      mode = "All",
      status = "Active",
    } = req.query;

    const filter = {};

    if (type !== "All") {
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid opportunity type filter.",
        });
      }

      filter.type = type;
    }

    if (mode !== "All") {
      if (!allowedModes.includes(mode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid work mode filter.",
        });
      }

      filter.mode = mode;
    }

    if (status !== "All") {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter.",
        });
      }

      filter.status = status;
    }

    const query = String(search).trim();

    if (query) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuery, "i");

      filter.$or = [
        { title: regex },
        { company: regex },
        { location: regex },
        { description: regex },
        { skills: regex },
      ];
    }

    const opportunities = await Opportunity.find(filter).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    console.error("List opportunities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load opportunities.",
    });
  }
});

// GET /api/opportunities/:id
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID.",
      });
    }

    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    return res.json({
      success: true,
      opportunity,
    });
  } catch (error) {
    console.error("Get opportunity error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load opportunity.",
    });
  }
});

// POST /api/opportunities
router.post("/", async (req, res) => {
  try {
    const validationError = validateOpportunity(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const opportunity = await Opportunity.create(
      makePayload(req.body)
    );

    return res.status(201).json({
      success: true,
      message: "Opportunity added successfully.",
      opportunity,
    });
  } catch (error) {
    console.error("Create opportunity error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add opportunity.",
    });
  }
});

// PUT /api/opportunities/:id
router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID.",
      });
    }

    const validationError = validateOpportunity(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const opportunity = await Opportunity.findByIdAndUpdate(
      req.params.id,
      { $set: makePayload(req.body) },
      { new: true, runValidators: true }
    );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    return res.json({
      success: true,
      message: "Opportunity updated successfully.",
      opportunity,
    });
  } catch (error) {
    console.error("Update opportunity error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update opportunity.",
    });
  }
});

// DELETE /api/opportunities/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid opportunity ID.",
      });
    }

    const opportunity = await Opportunity.findByIdAndDelete(
      req.params.id
    );

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    return res.json({
      success: true,
      message: "Opportunity deleted successfully.",
    });
  } catch (error) {
    console.error("Delete opportunity error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete opportunity.",
    });
  }
});

module.exports = router;
