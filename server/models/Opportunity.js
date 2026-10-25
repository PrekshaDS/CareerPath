
const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Internship", "Full-time", "Part-time", "Remote Internship"],
      default: "Internship",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      default: "On-site",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    stipend: {
      type: String,
      default: "Not specified",
    },
    eligibility: {
      type: String,
      default: "Check the employer's requirements",
    },
    applicationUrl: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
