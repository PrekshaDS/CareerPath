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
    targetCareer: {
      type: String,
      default: "Not selected"
    },
    skills: {
      type: [String],
      default: []
    },
    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 12
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
