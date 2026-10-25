
const mongoose = require("mongoose");
const Career = require("./models/Career");

const careers = [
  {
    title: "Java Developer",
    description: "Build backend applications and enterprise software using Java.",
    skills: ["Java", "OOP", "DSA", "SQL", "Spring Boot"],
    salary: "₹4–₹12 LPA",
    category: "Technology"
  },
  {
    title: "Full Stack Developer",
    description: "Develop complete web applications with frontend and backend technologies.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"],
    salary: "₹5–₹12 LPA",
    category: "Technology"
  },
  {
    title: "Frontend Developer",
    description: "Create responsive and interactive user interfaces for web applications.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Git"],
    salary: "₹3–₹9 LPA",
    category: "Technology"
  },
  {
    title: "Backend Developer",
    description: "Build APIs, server-side applications, and database integrations.",
    skills: ["Java", "Node.js", "REST APIs", "SQL", "MongoDB"],
    salary: "₹4–₹12 LPA",
    category: "Technology"
  },
  {
    title: "AI Engineer",
    description: "Develop intelligent applications using machine learning and AI models.",
    skills: ["Python", "Machine Learning", "Deep Learning", "APIs"],
    salary: "₹5–₹15 LPA",
    category: "Artificial Intelligence"
  },
  {
    title: "Machine Learning Engineer",
    description: "Train, evaluate, and deploy machine learning models.",
    skills: ["Python", "Scikit-learn", "Statistics", "TensorFlow"],
    salary: "₹5–₹15 LPA",
    category: "Artificial Intelligence"
  },
  {
    title: "Data Scientist",
    description: "Analyse complex data and develop predictive models for decision-making.",
    skills: ["Python", "SQL", "Statistics", "Pandas", "Machine Learning"],
    salary: "₹5–₹14 LPA",
    category: "Data & Analytics"
  },
  {
    title: "Data Engineer",
    description: "Design data pipelines and systems that process large datasets.",
    skills: ["Python", "SQL", "ETL", "Data Warehousing", "Cloud"],
    salary: "₹5–₹13 LPA",
    category: "Data & Analytics"
  },
  {
    title: "Cybersecurity Analyst",
    description: "Monitor systems, investigate security incidents, and identify vulnerabilities.",
    skills: ["Networking", "Linux", "Security Tools", "Risk Analysis"],
    salary: "₹3.5–₹9 LPA",
    category: "Cybersecurity"
  },
  {
    title: "DevOps Engineer",
    description: "Automate software delivery, deployment, and infrastructure operations.",
    skills: ["Linux", "Git", "Docker", "CI/CD", "Cloud"],
    salary: "₹4–₹12 LPA",
    category: "Cloud & DevOps"
  },
  {
    title: "Mobile App Developer",
    description: "Build applications for Android and other mobile platforms.",
    skills: ["Java", "Kotlin", "Flutter", "Dart", "APIs"],
    salary: "₹3.5–₹10 LPA",
    category: "Technology"
  },
  {
    title: "QA Automation Engineer",
    description: "Test software quality by creating automated test cases and test frameworks.",
    skills: ["Java", "Selenium", "Testing", "SQL", "API Testing"],
    salary: "₹3.5–₹9 LPA",
    category: "Quality Assurance"
  }
];

async function addCareers() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/career_guidance");

    let added = 0;
    let skipped = 0;

    for (const career of careers) {
      const existing = await Career.findOne({ title: career.title });

      if (existing) {
        console.log(`Skipped existing career: ${career.title}`);
        skipped++;
        continue;
      }

      const lastCareer = await Career.findOne().sort({ id: -1 });
      const nextId = lastCareer ? lastCareer.id + 1 : 1;

      await Career.create({
        id: nextId,
        ...career
      });

      console.log(`Added: ${career.title}`);
      added++;
    }

    console.log(`\nFinished! Added: ${added}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("Could not add careers:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addCareers();
