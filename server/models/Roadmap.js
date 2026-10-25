
const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    targetCareer: {
      type: String,
      required: true,
    },
    steps: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          default: "",
        },
        category: {
          type: String,
          default: "Learning",
        },
        completed: {
          type: Boolean,
          default: false,
        },
        dueDate: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
