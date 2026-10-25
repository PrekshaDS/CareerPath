
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student"
    },

    targetCareer: {
      type: String,
      default: "Not selected",
      trim: true
    },

    skills: {
      type: [String],
      default: []
    },

    interests: {
      type: [String],
      default: []
    },

    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 12
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500
    },

    college: {
      type: String,
      default: ""
    },

    github: {
      type: String,
      default: ""
    },

    linkedin: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
