
const express = require("express");
const Career = require("../models/Career");
const Assessment = require("../models/Assessment");

const router = express.Router();

// GET - APTITUDE QUESTIONS
router.get("/questions", (req, res) => {
  res.status(200).json({
    success: true,
    questions: [
      {
        id: 1,
        question: "Which activity do you enjoy the most?",
        options: [
          { text: "Building applications and writing code", category: "Technology" },
          { text: "Analyzing numbers and finding patterns", category: "Analytics" },
          { text: "Creating designs and visual content", category: "Design" },
          { text: "Planning projects and leading people", category: "Management" }
        ]
      },
      {
        id: 2,
        question: "Which task would you prefer?",
        options: [
          { text: "Solving a difficult technical problem", category: "Technology" },
          { text: "Studying data to make decisions", category: "Analytics" },
          { text: "Designing an attractive user interface", category: "Design" },
          { text: "Organizing a team to achieve a goal", category: "Management" }
        ]
      },
      {
        id: 3,
        question: "Which skill would you most like to improve?",
        options: [
          { text: "Programming and software development", category: "Technology" },
          { text: "Statistics and data interpretation", category: "Analytics" },
          { text: "Creativity and visual communication", category: "Design" },
          { text: "Leadership and decision-making", category: "Management" }
        ]
      },
      {
        id: 4,
        question: "What kind of work environment appeals to you?",
        options: [
          { text: "Developing and testing software", category: "Technology" },
          { text: "Working with reports, data, and insights", category: "Analytics" },
          { text: "Creating user-friendly digital experiences", category: "Design" },
          { text: "Coordinating people and business activities", category: "Management" }
        ]
      },
      {
        id: 5,
        question: "When you face a challenge, what do you usually do?",
        options: [
          { text: "Break it down and find a technical solution", category: "Technology" },
          { text: "Examine evidence before deciding", category: "Analytics" },
          { text: "Explore several creative approaches", category: "Design" },
          { text: "Discuss options and organize a plan", category: "Management" }
        ]
      },
      {
        id: 6,
        question: "Which project sounds most interesting?",
        options: [
          { text: "Building a website or mobile application", category: "Technology" },
          { text: "Finding trends in a large dataset", category: "Analytics" },
          { text: "Designing an app's screens and user experience", category: "Design" },
          { text: "Planning a product launch or business project", category: "Management" }
        ]
      },
      {
        id: 7,
        question: "Which strength describes you best?",
        options: [
          { text: "Logical thinking and debugging", category: "Technology" },
          { text: "Attention to detail and numerical reasoning", category: "Analytics" },
          { text: "Imagination and visual thinking", category: "Design" },
          { text: "Communication and organization", category: "Management" }
        ]
      },
      {
        id: 8,
        question: "Which result would make you feel most satisfied?",
        options: [
          { text: "A program that works correctly", category: "Technology" },
          { text: "A discovery supported by data", category: "Analytics" },
          { text: "A design people enjoy using", category: "Design" },
          { text: "A team successfully completing its goal", category: "Management" }
        ]
      }
    ]
  });
});

// POST - SUBMIT ASSESSMENT AND CALCULATE MATCHES
router.post("/", async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length !== 8) {
      return res.status(400).json({
        success: false,
        message: "Please answer all 8 questions."
      });
    }

    const validCategories = [
      "Technology",
      "Analytics",
      "Design",
      "Management"
    ];

    const questionIds = new Set();
    const scores = {
      Technology: 0,
      Analytics: 0,
      Design: 0,
      Management: 0
    };

    for (const answer of answers) {
      if (
        !Number.isInteger(answer.questionId) ||
        answer.questionId < 1 ||
        answer.questionId > 8 ||
        questionIds.has(answer.questionId) ||
        !validCategories.includes(answer.selectedOption)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or duplicate answers. Please submit valid answers."
        });
      }

      questionIds.add(answer.questionId);
      scores[answer.selectedOption]++;
    }

    if (questionIds.size !== 8) {
      return res.status(400).json({
        success: false,
        message: "Please answer every question exactly once."
      });
    }

    // Retrieve careers from the existing MongoDB collection.
    const careers = await Career.find();

    if (careers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No careers found. Please add careers before taking the assessment."
      });
    }

    // Match career categories to the assessment categories.
    const categoryAliases = {
      technology: "Technology",
      tech: "Technology",
      software: "Technology",
      development: "Technology",
      analytics: "Analytics",
      analyst: "Analytics",
      data: "Analytics",
      design: "Design",
      creative: "Design",
      management: "Management",
      business: "Management",
      leadership: "Management"
    };

    const totalAnswers = answers.length;

    const results = careers.map((career) => {
      const normalizedCategory = String(career.category)
        .toLowerCase()
        .trim();

      const matchedCategory =
        categoryAliases[normalizedCategory] || null;

      const categoryScore = matchedCategory
        ? scores[matchedCategory]
        : 0;

      // A score out of 100 based on answers matching this career's category.
      const matchPercentage = Math.round(
        (categoryScore / totalAnswers) * 100
      );

      return {
        careerId: career.id,
        careerTitle: career.title,
        matchPercentage,
        explanation: matchedCategory
          ? `${categoryScore} of ${totalAnswers} answers matched the ${matchedCategory} interest category.`
          : `Your answers did not directly match the career category "${career.category}". Explore its skills and description to decide whether it interests you.`
      };
    });

    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const assessment = await Assessment.create({
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOption: answer.selectedOption
      })),
      results
    });

    res.status(201).json({
      success: true,
      message: "Assessment completed successfully!",
      assessmentId: assessment._id,
      scores,
      results,
      createdAt: assessment.createdAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - ASSESSMENT HISTORY
router.get("/history", async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      assessments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - ONE PREVIOUS ASSESSMENT
router.get("/history/:id", async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment ID."
      });
    }

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found."
      });
    }

    res.status(200).json({
      success: true,
      assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
