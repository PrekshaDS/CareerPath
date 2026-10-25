
const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    answers: {
      type: [
        {
          questionId: {
            type: Number,
            required: true
          },
          selectedOption: {
            type: String,
            required: true
          }
        }
      ],
      required: true
    },

    results: {
      type: [
        {
          careerId: {
            type: Number,
            required: true
          },
          careerTitle: {
            type: String,
            required: true
          },
          matchPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
          },
          explanation: {
            type: String,
            required: true
          }
        }
      ],
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
