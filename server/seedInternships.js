
const mongoose = require("mongoose");
const Internship = require("./models/Internship");

const sampleInternships = [
  {
    title: "Java Developer Intern",
    company: "CareerPath Demo",
    location: "Remote",
    mode: "Remote",
    type: "Internship",
    description:
      "Demo listing for students to practise Java, OOP concepts, problem-solving, and basic application development.",
    skills: ["Java", "OOP", "SQL", "Git"],
    stipend: "Demo stipend — not specified",
    category: "Technology",
    applyUrl: "",
    active: true,
  },
  {
    title: "Frontend Developer Intern",
    company: "CareerPath Demo",
    location: "Bengaluru, Karnataka",
    mode: "Hybrid",
    type: "Internship",
    description:
      "Demo listing to practise building responsive interfaces and connecting frontend applications to APIs.",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    stipend: "Demo stipend — not specified",
    category: "Web Development",
    applyUrl: "",
    active: true,
  },
  {
    title: "Data Analyst Intern",
    company: "Sample Technology Co.",
    location: "Remote",
    mode: "Remote",
    type: "Internship",
    description:
      "Demo listing for learning data cleaning, basic analysis, and presenting insights from datasets.",
    skills: ["Python", "SQL", "Excel", "Data Analysis"],
    stipend: "Demo stipend — not specified",
    category: "Analytics",
    applyUrl: "",
    active: true,
  },
  {
    title: "Full Stack Developer Intern",
    company: "Sample Technology Co.",
    location: "Bengaluru, Karnataka",
    mode: "On-site",
    type: "Internship",
    description:
      "Demo listing to practise developing web applications with a frontend, backend APIs, and a database.",
    skills: ["React", "Node.js", "Express", "MongoDB"],
    stipend: "Demo stipend — not specified",
    category: "Technology",
    applyUrl: "",
    active: true,
  },
];

async function seedInternships() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/career_guidance");

    const existingCount = await Internship.countDocuments();

    if (existingCount > 0) {
      console.log(
        `Skipped: ${existingCount} internship records already exist.`
      );
      return;
    }

    const internships = await Internship.insertMany(sampleInternships);

    console.log(`Successfully added ${internships.length} demo internships.`);
  } catch (error) {
    console.error("Failed to seed internships:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedInternships();
