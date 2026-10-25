
import { useCallback, useEffect, useMemo, useState } from "react";
import InternshipPortal from "./InternshipPortal";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const API_URL = `${API_BASE_URL}/api/careers`;
const AUTH_API = `${API_BASE_URL}/api/auth`;
const ASSESSMENT_API = `${API_BASE_URL}/api/assessments`;
const emptyCareer = {
  title: "",
  description: "",
  skills: "",
  salary: "",
  category: "Technology",
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }
  return data;
}

const getCareerId = (career) => career?._id ?? career?.id;

function normalizeCareer(career) {
  return {
    ...career,
    skills: Array.isArray(career?.skills)
      ? career.skills
      : typeof career?.skills === "string"
        ? career.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
  };
}

function getCareerIcon(category = "") {
  switch (category.toLowerCase()) {
    case "technology": return "⌘";
    case "data":
    case "analytics": return "▥";
    case "design": return "✳";
    case "cloud": return "☁";
    case "security": return "◈";
    case "business":
    case "management": return "↗";
    default: return "✦";
  }
}

const emptyProfile = {
  name: "",
  targetCareer: "Not selected",
  semester: "1",
  skills: "",
  interests: "",
  bio: "",
  college: "",
  github: "",
  linkedin: "",
};

function profileToForm(profile = {}) {
  return {
    name: profile.name || "",
    targetCareer: profile.targetCareer || "Not selected",
    semester: String(profile.semester || 1),
    skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
    interests: Array.isArray(profile.interests)
      ? profile.interests.join(", ")
      : "",
    bio: profile.bio || "",
    college: profile.college || "",
    github: profile.github || "",
    linkedin: profile.linkedin || "",
  };
}

function App() {
  // Career library
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Internship and jobs portal
  const [showJobsPortal, setShowJobsPortal] = useState(false);

  // Authentication
  const [showLogin, setShowLogin] = useState(false);
  const [showStudentAuth, setShowStudentAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [student, setStudent] = useState(() => {
    try {
      const user = sessionStorage.getItem("careerPathUser");
      const token = sessionStorage.getItem("careerPathToken");
      const parsed = user ? JSON.parse(user) : null;
      return token && parsed && parsed.role !== "admin" ? parsed : null;
    } catch {
      return null;
    }
  });

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    targetCareer: "Not selected",
    semester: "1",
  });

  // Student profile
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [profileForm, setProfileForm] = useState(emptyProfile);

  // Dashboards
  const [showDashboard, setShowDashboard] = useState(false);
  const [showStudentDashboard, setShowStudentDashboard] = useState(false);
  const [dashboardHistory, setDashboardHistory] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // Admin career editor
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formCareer, setFormCareer] = useState(emptyCareer);
  const [saving, setSaving] = useState(false);

  // Assessment
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [assessmentError, setAssessmentError] = useState("");
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Browser-saved goals and careers
  const [completedGoals, setCompletedGoals] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("careerPathCompletedGoals") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [savedCareerIds, setSavedCareerIds] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("careerPathSavedCareers") || "[]"
      ).map(String);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "careerPathCompletedGoals",
      JSON.stringify(completedGoals)
    );
  }, [completedGoals]);

  useEffect(() => {
    localStorage.setItem(
      "careerPathSavedCareers",
      JSON.stringify(savedCareerIds)
    );
  }, [savedCareerIds]);

  const toggleSavedCareer = (career) => {
    const id = String(getCareerId(career) ?? career.title);
    setSavedCareerIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Open the internships and jobs portal
  const openJobsPortal = () => {
    setShowJobsPortal(true);
    setShowDashboard(false);
    setShowStudentDashboard(false);
    setShowLogin(false);
    setShowStudentAuth(false);
    setShowCareerModal(false);
  };

  // Return from the internships portal
  const closeJobsPortal = () => {
    setShowJobsPortal(false);
  };

  // Load career records
  const loadCareers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await readResponse(response);
      const list = Array.isArray(data) ? data : data.careers;

      if (!Array.isArray(list)) {
        throw new Error("The API did not return a career list.");
      }

      setCareers(list.map(normalizeCareer));
    } catch (err) {
      console.error("Load careers:", err);
      setError(
        "Unable to load careers. Check that your backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(careers.map((career) => career.category).filter(Boolean)),
    ],
    [careers]
  );

  const filteredCareers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return careers.filter((career) => {
      const matchesCategory =
        categoryFilter === "All" || career.category === categoryFilter;

      const searchable = [
        career.title,
        career.description,
        career.category,
        ...(career.skills || []),
      ].join(" ").toLowerCase();

      return matchesCategory && searchable.includes(query);
    });
  }, [careers, search, categoryFilter]);

  // Admin career CRUD
  const openAddModal = () => {
    setEditingId(null);
    setFormCareer({ ...emptyCareer });
    setError("");
    setNotice("");
    setShowCareerModal(true);
  };

  const openEditModal = (career) => {
    setEditingId(getCareerId(career));
    setFormCareer({
      title: career.title || "",
      description: career.description || "",
      skills: (career.skills || []).join(", "),
      salary: career.salary || "",
      category: career.category || "Technology",
    });
    setError("");
    setNotice("");
    setShowCareerModal(true);
  };

  const handleCareerFormChange = (event) => {
    setFormCareer((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSaveCareer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const token = sessionStorage.getItem("careerPathToken");
    if (!token) {
      setError("Please log in as an administrator first.");
      setSaving(false);
      return;
    }

    const payload = {
      title: formCareer.title.trim(),
      description: formCareer.description.trim(),
      skills: formCareer.skills.split(",").map((s) => s.trim()).filter(Boolean),
      salary: formCareer.salary.trim(),
      category: formCareer.category,
    };

    try {
      const editing = editingId !== null && editingId !== undefined;
      const response = await fetch(
        editing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await readResponse(response);

      if (editing) {
        const updated = normalizeCareer(data.career || {
          ...payload,
          _id: editingId,
        });

        setCareers((current) =>
          current.map((career) =>
            String(getCareerId(career)) === String(editingId)
              ? updated
              : career
          )
        );
        setNotice("Career updated successfully.");
      } else {
        await loadCareers();
        setNotice("Career added successfully.");
      }

      setShowCareerModal(false);
      setEditingId(null);
      setFormCareer({ ...emptyCareer });
    } catch (err) {
      setError(err.message || "Unable to save the career.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCareer = async (career) => {
    const id = getCareerId(career);

    if (id == null || id === "") {
      setError("This career has no ID and cannot be deleted.");
      return;
    }

    if (!window.confirm(`Delete "${career.title}"?`)) return;

    try {
      const token = sessionStorage.getItem("careerPathToken");
      if (!token) throw new Error("Please log in as an administrator.");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await readResponse(response);
      setCareers((current) =>
        current.filter((item) => String(getCareerId(item)) !== String(id))
      );
      setNotice(`"${career.title}" was deleted successfully.`);
    } catch (err) {
      setError(err.message || "Unable to delete the career.");
    }
  };

  // Admin login
  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setNotice("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || "").trim(),
          password: String(form.get("password") || ""),
        }),
      });

      const data = await readResponse(response);
      const account = data.user || data.student;

      if (!data.token || !account) {
        throw new Error("Login response did not include a token and account.");
      }

      if (account.role !== "admin") {
        throw new Error("This account is not an administrator.");
      }

      sessionStorage.setItem("careerPathToken", data.token);
      sessionStorage.setItem("careerPathUser", JSON.stringify(account));

      setStudent(null);
      setIsLoggedIn(true);
      setShowLogin(false);
      setShowStudentAuth(false);
      setShowStudentDashboard(false);
      setShowJobsPortal(false);
      setShowDashboard(true);
      setNotice(`Welcome back, ${account.name || "Administrator"}.`);
    } catch (err) {
      setAuthError(err.message || "Unable to log in.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Student authentication
  const handleStudentFormChange = (event) => {
    setStudentForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleStudentAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    const registering = authMode === "register";

    try {
      const response = await fetch(
        `${AUTH_API}/${registering ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: studentForm.name.trim(),
            email: studentForm.email.trim(),
            password: studentForm.password,
            targetCareer: studentForm.targetCareer,
            semester: Number(studentForm.semester),
          }),
        }
      );

      const data = await readResponse(response);

      if (registering) {
        setAuthMode("login");
        setStudentForm((current) => ({ ...current, password: "" }));
        setAuthMessage("Registration successful! Please log in.");
        return;
      }

      const account = data.user || data.student;

      if (!data.token || !account) {
        throw new Error("Login response did not include a user token.");
      }

      sessionStorage.setItem("careerPathToken", data.token);
      sessionStorage.setItem("careerPathUser", JSON.stringify(account));

      if (account.role === "admin") {
        setStudent(null);
        setIsLoggedIn(true);
        setShowStudentAuth(false);
        setShowJobsPortal(false);
        setShowDashboard(true);
        setShowStudentDashboard(false);
        setNotice(`Welcome back, ${account.name || "Administrator"}.`);
        return;
      }

      setStudent(account);
      setShowStudentAuth(false);
      setShowLogin(false);
      setShowDashboard(false);
      setShowJobsPortal(false);
      setShowStudentDashboard(true);
      setNotice(`Welcome, ${account.name || "Student"}!`);

      await Promise.all([
        loadStudentProfile(),
        loadStudentDashboard(),
      ]);
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Load the logged-in student's saved profile
  const loadStudentProfile = async () => {
    const token = sessionStorage.getItem("careerPathToken");

    if (!token) {
      setProfileError("Please log in to view your profile.");
      return;
    }

    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await readResponse(response);

      if (!data.student) {
        throw new Error("Student profile was not returned by the server.");
      }

      setStudent(data.student);
      sessionStorage.setItem("careerPathUser", JSON.stringify(data.student));
      setProfileForm(profileToForm(data.student));
    } catch (err) {
      console.error("Load profile:", err);
      setProfileError(err.message || "Unable to load your profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileFormChange = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  // Save profile changes to MongoDB via the backend
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const token = sessionStorage.getItem("careerPathToken");

    if (!token) {
      setProfileError("Your session has expired. Please log in again.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileNotice("");

    const payload = {
      name: profileForm.name.trim(),
      targetCareer: profileForm.targetCareer.trim(),
      semester: Number(profileForm.semester),
      skills: profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
      interests: profileForm.interests.split(",").map((s) => s.trim()).filter(Boolean),
      bio: profileForm.bio.trim(),
      college: profileForm.college.trim(),
      github: profileForm.github.trim(),
      linkedin: profileForm.linkedin.trim(),
    };

    try {
      const response = await fetch(`${AUTH_API}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await readResponse(response);

      if (!data.student) {
        throw new Error("Updated profile was not returned by the server.");
      }

      setStudent(data.student);
      sessionStorage.setItem("careerPathUser", JSON.stringify(data.student));
      setProfileForm(profileToForm(data.student));
      setShowProfileForm(false);
      setProfileNotice("Your profile has been updated successfully.");
    } catch (err) {
      console.error("Save profile:", err);
      setProfileError(err.message || "Unable to save your profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleStudentLogout = () => {
    sessionStorage.removeItem("careerPathToken");
    sessionStorage.removeItem("careerPathUser");
    setStudent(null);
    setShowStudentDashboard(false);
    setShowStudentAuth(false);
    setShowProfileForm(false);
    setShowJobsPortal(false);
    setNotice("You have logged out successfully.");
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("careerPathToken");
    sessionStorage.removeItem("careerPathUser");
    setIsLoggedIn(false);
    setShowDashboard(false);
    setShowJobsPortal(false);
    setNotice("You have logged out successfully.");
  };

  // Student dashboard and assessment history
  const loadStudentDashboard = async () => {
    setShowDashboard(false);
    setShowJobsPortal(false);
    setShowStudentDashboard(true);
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const token = sessionStorage.getItem("careerPathToken");
      const response = await fetch(`${ASSESSMENT_API}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await readResponse(response);
      setDashboardHistory(Array.isArray(data.assessments) ? data.assessments : []);
    } catch (err) {
      console.error("Student dashboard:", err);
      setDashboardError(err.message || "Unable to load student dashboard.");
    } finally {
      setDashboardLoading(false);
    }
  };

  // Assessment
  const startAssessment = async () => {
    setAssessmentError("");
    setAssessmentResults(null);
    setAnswers({});
    setShowHistory(false);
    setAssessmentLoading(true);

    try {
      const response = await fetch(`${ASSESSMENT_API}/questions`);
      const data = await readResponse(response);

      if (!Array.isArray(data.questions)) {
        throw new Error("Assessment questions could not be loaded.");
      }

      setQuestions(data.questions);
      setShowQuiz(true);
    } catch (err) {
      setAssessmentError(err.message || "Unable to load assessment questions.");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const submitAssessment = async () => {
    if (questions.length !== 8 || Object.keys(answers).length !== questions.length) {
      setAssessmentError("Please answer all 8 questions before submitting.");
      return;
    }

    setAssessmentError("");
    setSubmittingAssessment(true);

    const formattedAnswers = questions.map((question) => ({
      questionId: question.id,
      selectedOption: answers[question.id],
    }));

    try {
      const token = sessionStorage.getItem("careerPathToken");
      const response = await fetch(ASSESSMENT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      const data = await readResponse(response);
      setAssessmentResults(data);
      setShowQuiz(false);
      setShowHistory(false);
    } catch (err) {
      setAssessmentError(err.message || "Unable to submit your assessment.");
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const loadAssessmentHistory = async () => {
    setAssessmentError("");
    setHistoryLoading(true);
    setShowHistory(true);
    setShowQuiz(false);
    setAssessmentResults(null);

    try {
      const token = sessionStorage.getItem("careerPathToken");
      const response = await fetch(`${ASSESSMENT_API}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await readResponse(response);
      setAssessmentHistory(Array.isArray(data.assessments) ? data.assessments : []);
    } catch (err) {
      setAssessmentError(err.message || "Unable to load assessment history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const scrollTo = (id) => {
    setShowJobsPortal(false);
    setShowDashboard(false);
    setShowStudentDashboard(false);

    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const goToAssessmentFromDashboard = () => {
    setShowJobsPortal(false);
    setShowStudentDashboard(false);
    window.setTimeout(() => {
      document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const roadmapGoals = [
    {
      id: "explore",
      title: "Explore career paths",
      description: "Review roles, required skills, and salary ranges.",
    },
    {
      id: "assessment",
      title: "Complete a career assessment",
      description: "Discover career matches based on your interests.",
    },
    {
      id: "skills",
      title: "Identify skills to develop",
      description: "Choose technical and communication skills to improve.",
    },
    {
      id: "plan",
      title: "Create a learning plan",
      description: "Set a study schedule for your chosen career direction.",
    },
  ];

  const renderCareerCard = (career, index, admin = false) => {
    const id = String(getCareerId(career) ?? career.title);
    const saved = savedCareerIds.includes(id);

    return (
      <article
        className={admin ? "manage-career-card" : "public-career-card"}
        key={getCareerId(career) ?? `${career.title}-${index}`}
      >
        <div className={admin ? "manage-card-top" : "public-card-top"}>
          <div className={`career-symbol ${String(career.category || "").toLowerCase()}`}>
            {getCareerIcon(career.category)}
          </div>
          <span className="category-pill">{career.category || "Career"}</span>
        </div>

        <h3>{career.title}</h3>
        <p className={admin ? "manage-description" : "public-description"}>
          {career.description || "Explore this career path and its opportunities."}
        </p>

        {!admin && <div className="card-divider" />}
        {!admin && <span className="detail-label">SKILLS TO EXPLORE</span>}

        <div className="skill-list">
          {(career.skills || []).slice(0, 4).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        <div className={admin ? "manage-card-bottom" : "public-card-footer"}>
          <div>
            <small>{admin ? "Estimated salary" : "Salary range"}</small>
            <strong>{career.salary || "Varies by role"}</strong>
          </div>

          {admin ? (
            <div className="card-actions">
              <button
                className="icon-action edit-action"
                onClick={() => openEditModal(career)}
                aria-label={`Edit ${career.title}`}
                title="Edit career"
              >
                ✎
              </button>
              <button
                className="icon-action delete-action"
                onClick={() => handleDeleteCareer(career)}
                aria-label={`Delete ${career.title}`}
                title="Delete career"
              >
                ⌫
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button button-outline save-career-button"
              onClick={() => toggleSavedCareer(career)}
              aria-pressed={saved}
            >
              {saved ? "♥ Saved" : "♡ Save"}
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            scrollTo("home");
          }}
        >
          <span className="brand-mark">C</span>
          <span>Career<span className="brand-accent">Path</span></span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}>Home</a>
          <a href="#careers" onClick={(e) => { e.preventDefault(); scrollTo("careers"); }}>Explore Careers</a>
          <a href="#assessment" onClick={(e) => { e.preventDefault(); scrollTo("assessment"); }}>Assessment</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo("about"); }}>About</a>
        </nav>

        <div className="nav-actions">
          {/* NEW: Internship and job portal button */}
          <button
            type="button"
            className="button button-outline nav-action"
            onClick={openJobsPortal}
          >
            Internships & Jobs
          </button>

          {student ? (
            <>
              <span className="student-nav-name">Hi, {student.name}</span>
              <button className="button button-outline nav-action" onClick={loadStudentDashboard}>
                Student Dashboard
              </button>
              <button className="button button-outline nav-action" onClick={handleStudentLogout}>
                Log out
              </button>
            </>
          ) : isLoggedIn ? (
            <>
              <button
                className="button button-primary nav-action"
                onClick={() => {
                  setShowJobsPortal(false);
                  setShowDashboard(true);
                }}
              >
                Admin Dashboard
              </button>
              <button className="button button-outline nav-action" onClick={handleAdminLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button className="button button-outline nav-action" onClick={() => {
                setAuthMode("login");
                setAuthError("");
                setAuthMessage("");
                setShowStudentAuth(true);
              }}>
                Student Login
              </button>
              <button className="button button-primary nav-action" onClick={() => {
                setAuthMode("register");
                setAuthError("");
                setAuthMessage("");
                setShowStudentAuth(true);
              }}>
                Register
              </button>
              <button className="button button-outline nav-action" onClick={() => {
                setAuthError("");
                setShowLogin(true);
              }}>
                Admin Login ↗
              </button>
            </>
          )}
        </div>
      </header>

      {/* NEW: Render the InternshipPortal as its own page */}
      {showJobsPortal ? (
        <InternshipPortal
          student={student}
          onBack={closeJobsPortal}
        />
      ) : showDashboard && isLoggedIn ? (
        <main className="admin-page">
          <div className="admin-topline">
            <div>
              <span className="eyebrow">CAREERPATH WORKSPACE</span>
              <h1>Career management</h1>
              <p className="muted">Manage the career paths available to students.</p>
            </div>
            <button className="button button-primary" onClick={openAddModal}>
              ＋ Add a career
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-card"><span className="stat-icon">✦</span><div><strong>{careers.length}</strong><span>Career paths</span></div></div>
            <div className="stat-card"><span className="stat-icon">▦</span><div><strong>{categories.length - 1}</strong><span>Categories</span></div></div>
            <div className="stat-card"><span className="stat-icon">◉</span><div><strong>{loading ? "..." : "Live"}</strong><span>API connection</span></div></div>
          </div>

          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <section className="management-panel">
            <div className="management-heading">
              <div><h2>Career library</h2><p>Manage the career paths shown on your website.</p></div>
              <button className="button button-soft" onClick={loadCareers}>↻ Refresh list</button>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search career or skill..." />
              </label>
              <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categories.map((category) => <option key={category} value={category}>{category === "All" ? "All categories" : category}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="empty-state"><div className="loader" /><p>Loading careers...</p></div>
            ) : filteredCareers.length === 0 ? (
              <div className="empty-state"><h3>No careers found</h3><button className="button button-primary" onClick={openAddModal}>Add a career</button></div>
            ) : (
              <div className="management-grid">
                {filteredCareers.map((career, index) => renderCareerCard(career, index, true))}
              </div>
            )}
          </section>
        </main>
      ) : showStudentDashboard ? (
        <main className="student-dashboard">
          <div className="student-dashboard-header">
            <div>
              <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
              <h1>Welcome{student?.name ? `, ${student.name}` : ""}! 👋</h1>
              <p className="muted">Track your career exploration, results, profile, and learning goals.</p>
            </div>
            <button className="button button-primary" onClick={goToAssessmentFromDashboard}>
              Take an assessment →
            </button>
          </div>

          {dashboardError && <div className="alert alert-error" role="alert">{dashboardError}</div>}

          <section className="student-panel profile-panel">
            <div className="student-panel-heading">
              <div>
                <span className="eyebrow">YOUR ACCOUNT</span>
                <h2>My student profile</h2>
                <p className="muted">Keep your career goals, skills, and interests up to date.</p>
              </div>
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setProfileError("");
                  setProfileNotice("");
                  if (!showProfileForm) loadStudentProfile();
                  setShowProfileForm((current) => !current);
                }}
              >
                {showProfileForm ? "Cancel editing" : "✎ Edit profile"}
              </button>
            </div>

            {profileError && <div className="alert alert-error" role="alert">{profileError}</div>}
            {profileNotice && <div className="alert alert-success" role="status">{profileNotice}</div>}

            {profileLoading ? (
              <div className="empty-state"><div className="loader" /><p>Loading profile...</p></div>
            ) : showProfileForm ? (
              <form className="career-form profile-form" onSubmit={handleSaveProfile}>
                <label>Full name
                  <input name="name" value={profileForm.name} onChange={handleProfileFormChange} required />
                </label>
                <label>Email address
                  <input value={student?.email || ""} disabled readOnly />
                </label>
                <label>Target career
                  <input name="targetCareer" value={profileForm.targetCareer} onChange={handleProfileFormChange} placeholder="e.g. Java Developer" required />
                </label>
                <label>Current semester
                  <select name="semester" value={profileForm.semester} onChange={handleProfileFormChange} required>
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>Semester {index + 1}</option>
                    ))}
                  </select>
                </label>
                <label>Technical skills <span className="label-hint">Separate with commas</span>
                  <input name="skills" value={profileForm.skills} onChange={handleProfileFormChange} placeholder="Java, SQL, React, DSA" />
                </label>
                <label>Interests <span className="label-hint">Separate with commas</span>
                  <input name="interests" value={profileForm.interests} onChange={handleProfileFormChange} placeholder="Backend development, Cloud, AI" />
                </label>
                <label>College or university
                  <input name="college" value={profileForm.college} onChange={handleProfileFormChange} placeholder="Your college name" />
                </label>
                <label>About me
                  <textarea name="bio" value={profileForm.bio} onChange={handleProfileFormChange} placeholder="Write a short introduction..." rows={3} maxLength={500} />
                </label>
                <label>GitHub profile URL
                  <input type="url" name="github" value={profileForm.github} onChange={handleProfileFormChange} placeholder="https://github.com/username" />
                </label>
                <label>LinkedIn profile URL
                  <input type="url" name="linkedin" value={profileForm.linkedin} onChange={handleProfileFormChange} placeholder="https://linkedin.com/in/username" />
                </label>
                <div className="dialog-actions">
                  <button type="button" className="button button-outline" onClick={() => setShowProfileForm(false)} disabled={profileSaving}>Cancel</button>
                  <button type="submit" className="button button-primary" disabled={profileSaving}>
                    {profileSaving ? "Saving profile..." : "Save profile →"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="profile-summary">
                  <div className="profile-avatar">{(student?.name || "S").trim().charAt(0).toUpperCase()}</div>
                  <div>
                    <h3>{student?.name || "Student"}</h3>
                    <p>{student?.email || ""}</p>
                    <span className="category-pill">Semester {student?.semester || 1}</span>
                  </div>
                </div>

                <div className="student-stat-grid">
                  <article className="student-stat-card"><span className="student-stat-icon">↗</span><div><strong>{student?.targetCareer || "Not selected"}</strong><span>Target career</span></div></article>
                  <article className="student-stat-card"><span className="student-stat-icon">⌘</span><div><strong>{student?.skills?.length || 0}</strong><span>Skills added</span></div></article>
                  <article className="student-stat-card"><span className="student-stat-icon">✦</span><div><strong>{student?.interests?.length || 0}</strong><span>Interests added</span></div></article>
                </div>

                <div className="profile-detail-grid">
                  <div><span className="detail-label">TECHNICAL SKILLS</span><div className="skill-list">{student?.skills?.length ? student.skills.map((skill) => <span key={skill}>{skill}</span>) : <span>No skills added yet</span>}</div></div>
                  <div><span className="detail-label">INTERESTS</span><div className="skill-list">{student?.interests?.length ? student.interests.map((interest) => <span key={interest}>{interest}</span>) : <span>No interests added yet</span>}</div></div>
                  <div><span className="detail-label">COLLEGE</span><p>{student?.college || "Not added"}</p></div>
                  <div><span className="detail-label">ABOUT ME</span><p>{student?.bio || "Add a short introduction about yourself."}</p></div>
                  <div><span className="detail-label">ONLINE PROFILES</span>
                    <p>{student?.github ? <a href={student.github} target="_blank" rel="noreferrer">GitHub ↗</a> : "GitHub not added"}</p>
                    <p>{student?.linkedin ? <a href={student.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a> : "LinkedIn not added"}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {dashboardLoading ? (
            <div className="student-panel student-loading"><div className="loader" /><p>Loading dashboard...</p></div>
          ) : (
            <>
              <div className="student-stat-grid">
                <article className="student-stat-card"><span className="student-stat-icon">◎</span><div><strong>{dashboardHistory.length}</strong><span>Assessments completed</span></div></article>
                <article className="student-stat-card"><span className="student-stat-icon">✦</span><div><strong>{dashboardHistory[0]?.results?.[0]?.matchPercentage != null ? `${dashboardHistory[0].results[0].matchPercentage}%` : "—"}</strong><span>Latest top match</span></div></article>
                <article className="student-stat-card"><span className="student-stat-icon">⌘</span><div><strong>{careers.length}</strong><span>Career paths available</span></div></article>
              </div>

              <section className="student-panel">
                <div className="student-panel-heading"><div><span className="eyebrow">CAREER DISCOVERY</span><h2>Your latest recommendation</h2></div></div>
                {dashboardHistory[0]?.results?.length ? (
                  <div className="student-featured-career">
                    <div className="student-featured-icon">✦</div>
                    <div className="student-featured-content">
                      <h3>{dashboardHistory[0].results[0].careerTitle}</h3>
                      <p>{dashboardHistory[0].results[0].explanation || "Explore this career path."}</p>
                      <div className="match-track"><div style={{ width: `${Math.max(0, Math.min(100, dashboardHistory[0].results[0].matchPercentage || 0))}%` }} /></div>
                      <small>{dashboardHistory[0].results[0].matchPercentage}% match</small>
                    </div>
                  </div>
                ) : (
                  <div className="student-empty"><h3>Your career journey starts here</h3><p>Complete an assessment to discover career matches.</p><button className="button button-primary" onClick={goToAssessmentFromDashboard}>Start assessment →</button></div>
                )}
              </section>

              <section className="student-panel">
                <div className="student-panel-heading"><div><span className="eyebrow">YOUR ACTION PLAN</span><h2>Learning roadmap</h2><p className="muted">Mark each goal when you complete it.</p></div><span className="student-progress-label">{completedGoals.length}/4 complete</span></div>
                <div className="student-roadmap">
                  {roadmapGoals.map((goal) => (
                    <label className="roadmap-goal" key={goal.id}>
                      <input type="checkbox" checked={completedGoals.includes(goal.id)} onChange={(event) => setCompletedGoals((current) => event.target.checked ? [...current, goal.id] : current.filter((id) => id !== goal.id))} />
                      <span className="roadmap-goal-text"><strong>{goal.title}</strong><small>{goal.description}</small></span>
                      <span className="roadmap-check">{completedGoals.includes(goal.id) ? "✓" : "○"}</span>
                    </label>
                  ))}
                </div>
                <p className="student-footnote">Your completed goals are saved in this browser.</p>
              </section>

              <section className="student-panel">
                <div className="student-panel-heading"><div><span className="eyebrow">YOUR SHORTLIST</span><h2>Saved careers</h2><p className="muted">Keep interesting career paths together.</p></div><span className="student-progress-label">{savedCareerIds.length} saved</span></div>
                {careers.filter((career) => savedCareerIds.includes(String(getCareerId(career) ?? career.title))).length === 0 ? (
                  <div className="student-empty"><h3>No saved careers yet</h3><p>Explore careers and press Save to add them here.</p><button className="button button-primary" onClick={() => scrollTo("careers")}>Explore careers →</button></div>
                ) : (
                  <div className="student-saved-grid">
                    {careers.filter((career) => savedCareerIds.includes(String(getCareerId(career) ?? career.title))).map((career, index) => (
                      <article className="public-career-card" key={getCareerId(career) ?? `${career.title}-${index}`}>
                        <div className="public-card-top"><div className={`career-symbol ${String(career.category || "").toLowerCase()}`}>{getCareerIcon(career.category)}</div><span className="category-pill">{career.category}</span></div>
                        <h3>{career.title}</h3><p className="public-description">{career.description}</p>
                        <div className="skill-list">{(career.skills || []).slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div>
                        <div className="public-card-footer"><div><small>Salary range</small><strong>{career.salary || "Varies by role"}</strong></div><button className="button button-outline" onClick={() => toggleSavedCareer(career)}>Remove</button></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="student-panel">
                <div className="student-panel-heading"><div><span className="eyebrow">YOUR PROGRESS</span><h2>Assessment history</h2><p className="muted">Review your saved assessment results.</p></div><button className="button button-outline" onClick={loadStudentDashboard}>↻ Refresh</button></div>
                {dashboardHistory.length === 0 ? (
                  <div className="student-empty"><h3>No assessment history yet</h3><p>Complete an assessment to see your results here.</p></div>
                ) : (
                  <div className="student-history-list">
                    {dashboardHistory.map((item) => (
                      <article className="student-history-item" key={item._id}>
                        <div className="student-history-icon">✓</div>
                        <div className="student-history-content">
                          <h3>Career assessment</h3>
                          <p>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p>
                          <small>{item.answers?.length || 0} answers recorded</small>
                          {item.results?.slice(0, 3).map((result, index) => (
                            <div className="student-history-result" key={`${item._id}-${result.careerId}-${index}`}><span>{index + 1}. {result.careerTitle}</span><strong>{result.matchPercentage}%</strong></div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      ) : (
        <main>
          <section className="hero-section" id="home">
            <div className="hero-copy">
              <div className="hero-kicker"><span className="kicker-dot" /> YOUR FUTURE, YOUR DIRECTION</div>
              <h1>Make your next move a <span>meaningful one.</span></h1>
              <p className="hero-subtitle">Explore career paths, understand the skills that matter, and take a confident step toward the future you want.</p>
              <div className="hero-actions">
                <button className="button button-primary button-large" onClick={() => scrollTo("careers")}>Explore career paths →</button>
                <button className="button button-quiet button-large" onClick={() => scrollTo("assessment")}>Find your direction</button>
              </div>
              <div className="hero-proof"><div className="avatar-stack"><span>P</span><span>R</span><span>A</span></div><p><strong>Start with curiosity.</strong><br />Build a future that fits you.</p></div>
            </div>
            <div className="hero-art" aria-label="Career planning illustration">
              <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
              <div className="art-main-card">
                <div className="art-card-header"><span className="tiny-label">YOUR CAREER MAP</span><span className="status-dot" /></div>
                <div className="art-target"><div className="target-ring ring-outer"><div className="target-ring ring-middle"><div className="target-core">✦</div></div></div></div>
                <div className="art-card-caption"><span className="caption-icon">↗</span><div><strong>Find your next step</strong><small>Skills · Interests · Possibilities</small></div></div>
              </div>
              <div className="floating-note note-top"><span className="note-icon note-purple">✧</span><div><strong>Discover strengths</strong><small>Start with what you enjoy</small></div></div>
              <div className="floating-note note-bottom"><span className="note-icon note-green">✓</span><div><strong>Build your roadmap</strong><small>One step at a time</small></div></div>
              <div className="decor decor-star">✳</div><div className="decor decor-cross">＋</div>
            </div>
          </section>

          <section className="benefit-strip">
            <div><span className="benefit-icon">◎</span><div><strong>Explore possibilities</strong><small>Discover different career paths</small></div></div>
            <div><span className="benefit-icon">⌁</span><div><strong>Know the skills</strong><small>Understand what to learn next</small></div></div>
            <div><span className="benefit-icon">↗</span><div><strong>Move with confidence</strong><small>Make informed career choices</small></div></div>
          </section>

          <section className="careers-section public-careers" id="careers">
            <div className="section-heading"><div><span className="eyebrow">A WORLD OF POSSIBILITIES</span><h2>Explore career paths</h2><p>Get to know roles, essential skills, and where each path could take you.</p></div><span className="section-count">{careers.length} career paths ↗</span></div>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="public-toolbar">
              <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by role, skill, or interest" /></label>
              <div className="category-filters">{categories.map((category) => <button key={category} className={`filter-chip ${categoryFilter === category ? "active" : ""}`} onClick={() => setCategoryFilter(category)}>{category}</button>)}</div>
            </div>
            {loading ? <div className="empty-state"><div className="loader" /><p>Finding career paths...</p></div> : filteredCareers.length === 0 ? <div className="empty-state"><h3>No matching career paths</h3><p>Try another keyword or category.</p><button className="button button-soft" onClick={() => { setSearch(""); setCategoryFilter("All"); }}>Clear filters</button></div> : <div className="public-career-grid">{filteredCareers.map((career, index) => renderCareerCard(career, index))}</div>}
          </section>

          <section className="assessment-section" id="assessment">
            <div className="assessment-decoration">✳</div>
            <div className="assessment-content">
              <span className="eyebrow light-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
              <h2>Discover your career direction</h2>
              <p>Answer eight questions about your interests and preferences to discover career options to explore.</p>
              <div className="assessment-controls">
                <button className="button button-white" onClick={startAssessment} disabled={assessmentLoading || submittingAssessment}>{assessmentLoading ? "Loading questions..." : "Start assessment →"}</button>
                <button className="button button-white" onClick={loadAssessmentHistory} disabled={historyLoading}>{historyLoading ? "Loading history..." : "View assessment history"}</button>
              </div>
            </div>
            <div className="assessment-art"><div className="assessment-circle"><span>✦</span></div><div className="assessment-tag tag-one">Your interests</div><div className="assessment-tag tag-two">Your strengths</div><div className="assessment-tag tag-three">Your future</div></div>

            {assessmentError && <div className="assessment-message assessment-error" role="alert">{assessmentError}</div>}

            {showQuiz && (
              <div className="assessment-panel">
                <div className="assessment-panel-heading"><div><span className="eyebrow">YOUR PERSONAL ASSESSMENT</span><h3>Career interest quiz</h3></div><strong>{Object.keys(answers).length}/{questions.length} answered</strong></div>
                <div className="assessment-progress"><div style={{ width: `${questions.length ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }} /></div>
                {questions.map((question, index) => (
                  <fieldset className="question-card" key={question.id}>
                    <legend><span className="question-number">{String(index + 1).padStart(2, "0")}</span>{question.question}</legend>
                    <div className="answer-options">
                      {question.options.map((option) => (
                        <label className={`answer-option ${answers[question.id] === option.category ? "selected" : ""}`} key={option.category}>
                          <input type="radio" name={`question-${question.id}`} value={option.category} checked={answers[question.id] === option.category} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.category }))} />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="assessment-actions">
                  <button className="button button-primary" onClick={submitAssessment} disabled={submittingAssessment || Object.keys(answers).length !== questions.length}>{submittingAssessment ? "Calculating matches..." : "Submit and find my matches →"}</button>
                  <button className="button button-outline" onClick={() => { setShowQuiz(false); setAssessmentError(""); }} disabled={submittingAssessment}>Cancel</button>
                </div>
              </div>
            )}

            {assessmentResults && (
              <div className="assessment-panel">
                <span className="eyebrow">YOUR RESULTS</span><h3>Your career matches</h3><p>{assessmentResults.message}</p>
                {assessmentResults.results?.length ? <div className="assessment-results">{assessmentResults.results.map((result, index) => (
                  <article className="result-card" key={`${result.careerId}-${index}`}>
                    <div className="result-heading"><div className="result-rank">{String(index + 1).padStart(2, "0")}</div><div className="result-title"><h4>{result.careerTitle}</h4><p>{result.explanation}</p></div><strong className="match-percentage">{result.matchPercentage}%</strong></div>
                    <div className="match-track"><div style={{ width: `${Math.max(0, Math.min(100, result.matchPercentage || 0))}%` }} /></div>
                  </article>
                ))}</div> : <p>No career recommendations were returned. Add careers to your database and try again.</p>}
                <p className="assessment-disclaimer">Match scores indicate how closely your answers align with career interest categories. They are not scientifically validated aptitude predictions.</p>
                <button className="button button-primary" onClick={startAssessment}>Retake assessment</button>
                <button className="button button-outline result-history-button" onClick={loadAssessmentHistory}>View history</button>
                {student && <button className="button button-outline result-history-button" onClick={loadStudentDashboard}>Open student dashboard</button>}
              </div>
            )}

            {showHistory && (
              <div className="assessment-panel">
                <span className="eyebrow">SAVED ASSESSMENTS</span><h3>Assessment history</h3>
                {historyLoading ? <p>Loading saved assessments...</p> : assessmentHistory.length === 0 ? <p>No saved assessments yet. Complete the quiz to see your history.</p> : <div className="assessment-results">{assessmentHistory.map((item) => (
                  <article className="result-card" key={item._id}>
                    <h4>Assessment on {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown date"}</h4>
                    <p>{item.answers?.length || 0} answers saved</p>
                    {item.results?.slice(0, 3).map((result, index) => <p key={`${item._id}-${result.careerId}-${index}`}>{index + 1}. {result.careerTitle} — {result.matchPercentage}% match</p>)}
                  </article>
                ))}</div>}
                <button className="button button-outline" onClick={() => setShowHistory(false)}>Close history</button>
                {student && <button className="button button-outline result-history-button" onClick={loadStudentDashboard}>Open student dashboard</button>}
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="site-footer" id="about">
        <div className="footer-main">
          <a className="brand footer-brand" href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}>
            <span className="brand-mark">C</span><span>Career<span className="brand-accent">Path</span></span>
          </a>
          <p>Helping students discover possibilities and take their next step with confidence.</p>
          <div className="footer-links">
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}>Home</a>
            <a href="#careers" onClick={(e) => { e.preventDefault(); scrollTo("careers"); }}>Career paths</a>
            <a href="#assessment" onClick={(e) => { e.preventDefault(); scrollTo("assessment"); }}>Assessment</a>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 CareerPath. All rights reserved.</span><span>Designed for your next step ✦</span></div>
      </footer>

      {/* Student login and registration */}
      {showStudentAuth && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !authLoading) setShowStudentAuth(false); }}>
          <div className="dialog login-dialog" role="dialog" aria-modal="true" aria-labelledby="student-auth-title">
            <button type="button" className="dialog-close" onClick={() => setShowStudentAuth(false)} disabled={authLoading} aria-label="Close student login">×</button>
            <div className="dialog-brand"><span className="brand-mark">C</span></div>
            <span className="eyebrow">STUDENT WORKSPACE</span>
            <h2 id="student-auth-title">{authMode === "register" ? "Create your account" : "Welcome back"}</h2>
            <p className="dialog-subtitle">{authMode === "register" ? "Create your CareerPath student profile." : "Log in to continue your career journey."}</p>
            {authMessage && <div className="alert alert-success" role="status">{authMessage}</div>}
            {authError && <div className="alert alert-error" role="alert">{authError}</div>}
            <form className="career-form" onSubmit={handleStudentAuth}>
              {authMode === "register" && (
                <>
                  <label>Full name<input name="name" value={studentForm.name} onChange={handleStudentFormChange} placeholder="Enter your name" required /></label>
                  <label>Target career<input name="targetCareer" value={studentForm.targetCareer} onChange={handleStudentFormChange} placeholder="e.g. Java Developer" required /></label>
                  <label>Current semester<select name="semester" value={studentForm.semester} onChange={handleStudentFormChange} required>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Semester {index + 1}</option>)}</select></label>
                </>
              )}
              <label>Email address<input type="email" name="email" value={studentForm.email} onChange={handleStudentFormChange} placeholder="you@example.com" required /></label>
              <label>Password<input type="password" name="password" value={studentForm.password} onChange={handleStudentFormChange} placeholder="At least 8 characters" minLength={8} autoComplete={authMode === "register" ? "new-password" : "current-password"} required /></label>
              <button className="button button-primary button-full" type="submit" disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "register" ? "Create account →" : "Log in →"}</button>
            </form>
            <p className="demo-note">{authMode === "register" ? "Already registered?" : "New to CareerPath?"}{" "}
              <button type="button" className="button button-quiet" disabled={authLoading} onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setAuthError(""); setAuthMessage(""); }}>
                {authMode === "register" ? "Log in" : "Create an account"}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Admin login */}
      {showLogin && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !authLoading) setShowLogin(false); }}>
          <div className="dialog login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <button className="dialog-close" onClick={() => setShowLogin(false)} aria-label="Close login">×</button>
            <div className="dialog-brand"><span className="brand-mark">C</span></div>
            <span className="eyebrow">ADMIN WORKSPACE</span><h2 id="login-title">Welcome back</h2>
            <p className="dialog-subtitle">Sign in to manage the CareerPath career library.</p>
            <form onSubmit={handleLogin} className="career-form">
              <label>Email address<input type="email" name="email" placeholder="admin@careerpath.com" autoComplete="username" required /></label>
              <label>Password<input type="password" name="password" placeholder="Enter your password" autoComplete="current-password" required /></label>
              {authError && <div className="alert alert-error" role="alert">{authError}</div>}
              <button className="button button-primary button-full" type="submit" disabled={authLoading}>{authLoading ? "Signing in..." : "Open admin workspace →"}</button>
            </form>
            <p className="demo-note">Sign in with an administrator account configured by your backend.</p>
          </div>
        </div>
      )}

      {/* Add or edit career */}
      {showCareerModal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowCareerModal(false); }}>
          <div className="dialog career-dialog" role="dialog" aria-modal="true" aria-labelledby="career-dialog-title">
            <button className="dialog-close" onClick={() => !saving && setShowCareerModal(false)} aria-label="Close form">×</button>
            <span className="eyebrow">{editingId != null ? "UPDATE CAREER DETAILS" : "GROW THE CAREER LIBRARY"}</span>
            <h2 id="career-dialog-title">{editingId != null ? "Edit career path" : "Add a career path"}</h2>
            <p className="dialog-subtitle">Enter the career information below.</p>
            <form className="career-form" onSubmit={handleSaveCareer}>
              <label>Career title<input name="title" value={formCareer.title} onChange={handleCareerFormChange} placeholder="e.g. Software Developer" required /></label>
              <label>Description<textarea name="description" value={formCareer.description} onChange={handleCareerFormChange} placeholder="Describe the role..." rows={3} required /></label>
              <label>Skills <span className="label-hint">Separate with commas</span><input name="skills" value={formCareer.skills} onChange={handleCareerFormChange} placeholder="Java, SQL, Problem solving" required /></label>
              <div className="form-row">
                <label>Salary range<input name="salary" value={formCareer.salary} onChange={handleCareerFormChange} placeholder="₹5–12 LPA" required /></label>
                <label>Category<select name="category" value={formCareer.category} onChange={handleCareerFormChange} required><option>Technology</option><option>Analytics</option><option>Data</option><option>Design</option><option>Cloud</option><option>Security</option><option>Management</option><option>Business</option><option>Other</option></select></label>
              </div>
              {error && <div className="alert alert-error" role="alert">{error}</div>}
              <div className="dialog-actions">
                <button type="button" className="button button-outline" onClick={() => setShowCareerModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving..." : editingId != null ? "Save changes →" : "Add career →"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
