
import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/careers";
const ASSESSMENT_API = "http://localhost:5000/api/assessments";
const AUTH_API = "http://localhost:5000/api/auth";
const INTERNSHIP_API = "http://localhost:5000/api/internships";
const CERTIFICATE_API = "http://localhost:5000/api/certificates";
const ROADMAP_API = "http://localhost:5000/api/roadmap";

const emptyCareer = {
  title: "",
  description: "",
  skills: "",
  salary: "",
  category: "Technology",
};

const emptyCertificate = {
  title: "",
  provider: "",
  certificateUrl: "",
  completionDate: "",
  status: "In Progress",
};

const defaultSteps = [
  {
    title: "Learn Java fundamentals",
    description: "Study variables, loops, arrays, methods, and exception handling.",
    category: "Learning",
    completed: false,
  },
  {
    title: "Master OOP concepts",
    description: "Practise classes, objects, inheritance, polymorphism, and abstraction.",
    category: "Learning",
    completed: false,
  },
  {
    title: "Practise DSA",
    description: "Solve problems on arrays, strings, linked lists, stacks, and trees.",
    category: "Practice",
    completed: false,
  },
  {
    title: "Learn SQL and databases",
    description: "Practise SQL queries, joins, and database design.",
    category: "Learning",
    completed: false,
  },
  {
    title: "Build a Java project",
    description: "Build and publish a Java application on GitHub.",
    category: "Project",
    completed: false,
  },
  {
    title: "Prepare for interviews",
    description: "Practise aptitude, coding questions, and mock interviews.",
    category: "Preparation",
    completed: false,
  },
];

const careerId = (career) => career?._id ?? career?.id;

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

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }
  return data;
}

function getToken() {
  return localStorage.getItem("careerPathToken");
}

function authHeaders(json = false) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function App() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [showStudentAuth, setShowStudentAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [student, setStudent] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [selectedCareer, setSelectedCareer] = useState(null);

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    targetCareer: "Not selected",
    semester: "1",
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showStudentDashboard, setShowStudentDashboard] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("overview");

  const [showCareerModal, setShowCareerModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formCareer, setFormCareer] = useState(emptyCareer);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

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
  const [dashboardHistory, setDashboardHistory] = useState([]);

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");
  const [roadmapSaving, setRoadmapSaving] = useState(false);

  const [internships, setInternships] = useState([]);
  const [internshipsLoading, setInternshipsLoading] = useState(false);
  const [internshipError, setInternshipError] = useState("");
  const [internshipSearch, setInternshipSearch] = useState("");

  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");
  const [certificateNotice, setCertificateNotice] = useState("");
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [editingCertificateId, setEditingCertificateId] = useState(null);
  const [certificateForm, setCertificateForm] = useState(emptyCertificate);
  const [certificateSaving, setCertificateSaving] = useState(false);

  // ---------------- CAREERS ----------------

  const loadCareers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await readResponse(await fetch(API_URL));
      const list = Array.isArray(data) ? data : data.careers;
      if (!Array.isArray(list)) throw new Error("Career list was not returned.");
      setCareers(list.map(normalizeCareer));
    } catch (err) {
      console.error("Load careers:", err);
      setError("Unable to load careers. Check that your backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  const categories = useMemo(
    () => ["All", ...new Set(careers.map((c) => c.category).filter(Boolean))],
    [careers]
  );

  const filteredCareers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return careers.filter((career) => {
      const matchesCategory = categoryFilter === "All" || career.category === categoryFilter;
      const text = [
        career.title,
        career.description,
        career.category,
        ...(career.skills || []),
      ].join(" ").toLowerCase();
      return matchesCategory && text.includes(query);
    });
  }, [careers, search, categoryFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormCareer(emptyCareer);
    setError("");
    setNotice("");
    setShowCareerModal(true);
  };

  const openEditModal = (career) => {
    setEditingId(careerId(career));
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

  const handleSaveCareer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      title: formCareer.title.trim(),
      description: formCareer.description.trim(),
      skills: formCareer.skills.split(",").map((s) => s.trim()).filter(Boolean),
      salary: formCareer.salary.trim(),
      category: formCareer.category,
    };

    try {
      const editing = editingId !== null && editingId !== undefined;
      const response = await fetch(editing ? `${API_URL}/${editingId}` : API_URL, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readResponse(response);
      await loadCareers();
      setShowCareerModal(false);
      setFormCareer(emptyCareer);
      setEditingId(null);
      setNotice(editing ? "Career updated successfully." : "Career added successfully.");
      if (data.career) {
        setCareers((current) => {
          const updated = normalizeCareer(data.career);
          if (editing) {
            return current.map((c) => String(careerId(c)) === String(editingId) ? updated : c);
          }
          return current.some((c) => String(careerId(c)) === String(careerId(updated)))
            ? current
            : [...current, updated];
        });
      }
    } catch (err) {
      setError(err.message || "Could not save this career.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCareer = async (career) => {
    const id = careerId(career);
    if (!id) return setError("This career has no ID.");
    if (!window.confirm(`Delete "${career.title}"?`)) return;

    try {
      await readResponse(await fetch(`${API_URL}/${id}`, { method: "DELETE" }));
      setCareers((current) => current.filter((c) => String(careerId(c)) !== String(id)));
      setNotice(`"${career.title}" was deleted.`);
      setError("");
    } catch (err) {
      setError(err.message || "Could not delete this career.");
    }
  };

  // ---------------- AUTHENTICATION ----------------

  const handleStudentFormChange = (event) => {
    const { name, value } = event.target;
    setStudentForm((current) => ({ ...current, [name]: value }));
  };

  const handleStudentAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    const registering = authMode === "register";

    try {
      const data = await readResponse(await fetch(
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
      ));

      if (registering) {
        setAuthMode("login");
        setStudentForm((current) => ({ ...current, password: "" }));
        setAuthMessage("Registration successful! Please log in.");
        return;
      }

      if (!data.token || !data.student) {
        throw new Error("Login response did not contain student information.");
      }

      localStorage.setItem("careerPathToken", data.token);
      setStudent(data.student);
      setShowStudentAuth(false);
      setShowLogin(false);
      setShowDashboard(false);
      setShowStudentDashboard(true);
      setDashboardTab("overview");
      setNotice(`Welcome, ${data.student.name}!`);
      await loadStudentDashboard();
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStudentLogout = () => {
    localStorage.removeItem("careerPathToken");
    setStudent(null);
    setShowStudentDashboard(false);
    setShowStudentAuth(false);
    setRoadmap(null);
    setCertificates([]);
    setDashboardHistory([]);
    setNotice("You have logged out successfully.");
  };

  // ---------------- STUDENT DASHBOARD DATA ----------------

  const loadStudentDashboard = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setDashboardError("Please log in to view your student dashboard.");
      return;
    }

    setShowDashboard(false);
    setShowStudentDashboard(true);
    setDashboardLoading(true);
    setDashboardError("");

    const results = await Promise.allSettled([
      fetch(`${ASSESSMENT_API}/history`).then(readResponse),
      fetch(ROADMAP_API, { headers: authHeaders() }).then(readResponse),
      fetch(CERTIFICATE_API, { headers: authHeaders() }).then(readResponse),
      fetch(INTERNSHIP_API).then(readResponse),
    ]);

    if (results[0].status === "fulfilled") {
      setDashboardHistory(Array.isArray(results[0].value.assessments) ? results[0].value.assessments : []);
    } else {
      setDashboardHistory([]);
    }

    if (results[1].status === "fulfilled") {
      setRoadmap(results[1].value.roadmap || null);
      setRoadmapError("");
    } else {
      setRoadmap(null);
      setRoadmapError(results[1].reason?.message || "Could not load roadmap.");
    }

    if (results[2].status === "fulfilled") {
      setCertificates(Array.isArray(results[2].value.certificates) ? results[2].value.certificates : []);
      setCertificateError("");
    } else {
      setCertificates([]);
      setCertificateError(results[2].reason?.message || "Could not load certificates.");
    }

    if (results[3].status === "fulfilled") {
      setInternships(Array.isArray(results[3].value.internships) ? results[3].value.internships : []);
      setInternshipError("");
    } else {
      setInternshipError(results[3].reason?.message || "Could not load internships.");
    }

    setDashboardLoading(false);
  }, []);

  // Restore login after refresh.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getToken();
      if (!token) return;

      try {
        const data = await readResponse(await fetch(`${AUTH_API}/me`, {
          headers: authHeaders(),
        }));
        if (cancelled) return;
        if (!data.student) throw new Error("Student information was not returned.");
        setStudent(data.student);
        await loadStudentDashboard();
      } catch (err) {
        console.error("Session restoration:", err);
        if (!cancelled && err.message.toLowerCase().includes("token")) {
          localStorage.removeItem("careerPathToken");
        }
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, [loadStudentDashboard]);

  // ---------------- ROADMAP ----------------

  const createRoadmap = async () => {
    setRoadmapLoading(true);
    setRoadmapError("");
    try {
      const targetCareer = student?.targetCareer && student.targetCareer !== "Not selected"
        ? student.targetCareer
        : "Java Developer";

      const data = await readResponse(await fetch(ROADMAP_API, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ targetCareer, steps: defaultSteps }),
      }));

      setRoadmap(data.roadmap);
      setRoadmapError("");
    } catch (err) {
      setRoadmapError(err.message || "Could not create your roadmap.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const toggleRoadmapStep = async (step) => {
    if (!roadmap || !step._id) {
      setRoadmapError("This roadmap step has no ID. Refresh your roadmap.");
      return;
    }

    setRoadmapSaving(true);
    setRoadmapError("");
    try {
      const data = await readResponse(await fetch(`${ROADMAP_API}/steps/${step._id}`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ completed: !step.completed }),
      }));
      setRoadmap(data.roadmap);
    } catch (err) {
      setRoadmapError(err.message || "Could not update this step.");
    } finally {
      setRoadmapSaving(false);
    }
  };

  const deleteRoadmap = async () => {
    if (!window.confirm("Delete your roadmap? This cannot be undone.")) return;
    try {
      await readResponse(await fetch(ROADMAP_API, {
        method: "DELETE",
        headers: authHeaders(),
      }));
      setRoadmap(null);
      setRoadmapError("");
    } catch (err) {
      setRoadmapError(err.message || "Could not delete roadmap.");
    }
  };

  // ---------------- INTERNSHIPS ----------------

  const refreshInternships = async () => {
    setInternshipsLoading(true);
    setInternshipError("");
    try {
      const query = new URLSearchParams();
      if (internshipSearch.trim()) query.set("search", internshipSearch.trim());
      const url = `${INTERNSHIP_API}${query.toString() ? `?${query}` : ""}`;
      const data = await readResponse(await fetch(url));
      setInternships(Array.isArray(data.internships) ? data.internships : []);
    } catch (err) {
      setInternshipError(err.message || "Could not load internships.");
    } finally {
      setInternshipsLoading(false);
    }
  };

  const filteredInternships = useMemo(() => {
    const query = internshipSearch.trim().toLowerCase();
    if (!query) return internships;
    return internships.filter((item) =>
      [item.title, item.company, item.location, item.category, item.description, ...(item.skills || [])]
        .join(" ").toLowerCase().includes(query)
    );
  }, [internships, internshipSearch]);

  // ---------------- CERTIFICATES ----------------

  const openAddCertificate = () => {
    setEditingCertificateId(null);
    setCertificateForm(emptyCertificate);
    setCertificateError("");
    setCertificateNotice("");
    setShowCertificateForm(true);
  };

  const openEditCertificate = (certificate) => {
    setEditingCertificateId(certificate._id);
    setCertificateForm({
      title: certificate.title || "",
      provider: certificate.provider || "",
      certificateUrl: certificate.certificateUrl || "",
      completionDate: certificate.completionDate
        ? new Date(certificate.completionDate).toISOString().slice(0, 10)
        : "",
      status: certificate.status || "In Progress",
    });
    setCertificateError("");
    setCertificateNotice("");
    setShowCertificateForm(true);
  };

  const saveCertificate = async (event) => {
    event.preventDefault();
    setCertificateSaving(true);
    setCertificateError("");
    setCertificateNotice("");

    try {
      const editing = Boolean(editingCertificateId);
      const data = await readResponse(await fetch(
        editing ? `${CERTIFICATE_API}/${editingCertificateId}` : CERTIFICATE_API,
        {
          method: editing ? "PUT" : "POST",
          headers: authHeaders(true),
          body: JSON.stringify({
            ...certificateForm,
            completionDate: certificateForm.completionDate || null,
          }),
        }
      ));

      if (editing) {
        setCertificates((current) => current.map((c) =>
          c._id === editingCertificateId ? data.certificate || { ...c, ...certificateForm } : c
        ));
      } else if (data.certificate) {
        setCertificates((current) => [data.certificate, ...current]);
      } else {
        const refreshed = await readResponse(await fetch(CERTIFICATE_API, {
          headers: authHeaders(),
        }));
        setCertificates(refreshed.certificates || []);
      }

      setShowCertificateForm(false);
      setCertificateForm(emptyCertificate);
      setEditingCertificateId(null);
      setCertificateNotice(editing ? "Certificate updated." : "Certificate added.");
    } catch (err) {
      setCertificateError(err.message || "Could not save certificate.");
    } finally {
      setCertificateSaving(false);
    }
  };

  const deleteCertificate = async (certificate) => {
    if (!window.confirm(`Delete "${certificate.title}"?`)) return;
    setCertificateError("");
    try {
      await readResponse(await fetch(`${CERTIFICATE_API}/${certificate._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }));
      setCertificates((current) => current.filter((c) => c._id !== certificate._id));
      setCertificateNotice("Certificate deleted.");
    } catch (err) {
      setCertificateError(err.message || "Could not delete certificate.");
    }
  };

  // ---------------- ADMIN ----------------

  const handleLogin = (event) => {
    event.preventDefault();
    setIsLoggedIn(true);
    setShowLogin(false);
    setShowStudentDashboard(false);
    setShowDashboard(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowDashboard(false);
    setShowStudentDashboard(false);
  };

  // ---------------- ASSESSMENT ----------------

  const startAssessment = async () => {
    setAssessmentError("");
    setAssessmentResults(null);
    setAnswers({});
    setShowHistory(false);
    setAssessmentLoading(true);
    try {
      const data = await readResponse(await fetch(`${ASSESSMENT_API}/questions`));
      if (!Array.isArray(data.questions)) throw new Error("Assessment questions could not be loaded.");
      setQuestions(data.questions);
      setShowQuiz(true);
    } catch (err) {
      setAssessmentError(err.message || "Unable to load assessment.");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const submitAssessment = async () => {
    if (questions.length !== 8 || Object.keys(answers).length !== questions.length) {
      setAssessmentError("Please answer all 8 questions before submitting.");
      return;
    }

    setSubmittingAssessment(true);
    setAssessmentError("");
    try {
      const formattedAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id],
      }));
      const data = await readResponse(await fetch(ASSESSMENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: formattedAnswers }),
      }));
      setAssessmentResults(data);
      setShowQuiz(false);
      setShowHistory(false);
    } catch (err) {
      setAssessmentError(err.message || "Unable to submit assessment.");
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const loadAssessmentHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);
    setShowQuiz(false);
    setAssessmentResults(null);
    setAssessmentError("");
    try {
      const data = await readResponse(await fetch(`${ASSESSMENT_API}/history`));
      setAssessmentHistory(Array.isArray(data.assessments) ? data.assessments : []);
    } catch (err) {
      setAssessmentError(err.message || "Unable to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ---------------- NAVIGATION ----------------

  const scrollTo = (id) => {
    if (showDashboard || showStudentDashboard) {
      setShowDashboard(false);
      setShowStudentDashboard(false);
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToAssessmentFromDashboard = () => {
    setShowStudentDashboard(false);
    window.setTimeout(() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ---------------- CAREER CARD ----------------

  const renderCareerCard = (career, index, admin = false) => (
    <article
      className={admin ? "manage-career-card" : "public-career-card"}
      key={careerId(career) ?? `${career.title}-${index}`}
    >
      <div className={admin ? "manage-card-top" : "public-card-top"}>
        <div className={`career-symbol ${String(career.category || "").toLowerCase()}`}>
          {getCareerIcon(career.category)}
        </div>
        <span className="category-pill">{career.category || "Career"}</span>
      </div>
      <h3>{career.title}</h3>
      <p className={admin ? "manage-description" : "public-description"}>
        {career.description || "Explore this career path and the skills it may require."}
      </p>
      {!admin && <div className="card-divider" />}
      {!admin && <span className="detail-label">SKILLS TO EXPLORE</span>}
      <div className="skill-list">
        {(career.skills || []).slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
      </div>
      <div className={admin ? "manage-card-bottom" : "public-card-footer"}>
        <div>
          <small>{admin ? "Estimated salary" : "Salary range"}</small>
          <strong>{career.salary || "Varies by role"}</strong>
        </div>
        {admin ? (
          <div className="card-actions">
            <button className="icon-action edit-action" onClick={() => openEditModal(career)} aria-label={`Edit ${career.title}`}>✎</button>
            <button className="icon-action delete-action" onClick={() => handleDeleteCareer(career)} aria-label={`Delete ${career.title}`}>⌫</button>
          </div>
        ) : <span className="arrow-circle">↗</span>}
      </div>
    </article>
  );
  <button
  type="button"
  className="btn-primary"
  onClick={() => setSelectedCareer(career)}
>
  View Details
</button>

  const completedSteps = roadmap?.steps?.filter((step) => step.completed).length || 0;
  const totalSteps = roadmap?.steps?.length || 0;
  const roadmapPercentage = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // ---------------- PAGE UI ----------------

  return (
    <div className="app-shell">
      <header className="navbar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setShowDashboard(false); setShowStudentDashboard(false); scrollTo("home"); }}>
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
          {student ? (
            <>
              <span className="student-nav-name">Hi, {student.name}</span>
              <button className="button button-outline nav-action" onClick={() => { setDashboardTab("overview"); loadStudentDashboard(); }}>Student Dashboard</button>
              <button className="button button-outline nav-action" onClick={handleStudentLogout}>Log out</button>
            </>
          ) : (
            <>
              <button className="button button-outline nav-action" onClick={() => { setAuthMode("login"); setAuthError(""); setAuthMessage(""); setShowStudentAuth(true); }}>Student Login</button>
              <button className="button button-primary nav-action" onClick={() => { setAuthMode("register"); setAuthError(""); setAuthMessage(""); setShowStudentAuth(true); }}>Register</button>
              <button className="button button-outline nav-action" onClick={() => setShowLogin(true)}>Admin Login ↗</button>
            </>
          )}
        </div>
      </header>

      {showDashboard && isLoggedIn ? (
        <main className="admin-page">
          <div className="admin-topline">
            <div><span className="eyebrow">CAREERPATH WORKSPACE</span><h1>Career management</h1><p className="muted">Manage career information for students.</p></div>
            <div>
              <button className="button button-outline" onClick={handleLogout}>Exit admin</button>{" "}
              <button className="button button-primary" onClick={openAddModal}>＋ Add a career</button>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-card"><span className="stat-icon">✦</span><div><strong>{careers.length}</strong><span>Career paths</span></div></div>
            <div className="stat-card"><span className="stat-icon">▦</span><div><strong>{categories.length - 1}</strong><span>Categories</span></div></div>
            <div className="stat-card"><span className="stat-icon">◉</span><div><strong>Live</strong><span>API connection</span></div></div>
          </div>
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <section className="management-panel">
            <div className="management-heading"><div><h2>Career library</h2><p>Manage the career paths shown on your website.</p></div><button className="button button-soft" onClick={loadCareers}>↻ Refresh list</button></div>
            <div className="toolbar">
              <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search career or skill..." /></label>
              <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter category">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            {loading ? <div className="empty-state"><div className="loader" /><p>Loading careers…</p></div>
              : filteredCareers.length === 0 ? <div className="empty-state"><h3>No careers found</h3><button className="button button-primary" onClick={openAddModal}>Add a career</button></div>
                : <div className="management-grid">{filteredCareers.map((career, index) => renderCareerCard(career, index, true))}</div>}
          </section>
        </main>
      ) : showStudentDashboard ? (
        <main className="student-dashboard">
          <div className="student-dashboard-header">
            <div>
              <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
              <h1>Welcome, {student?.name || "Student"} 👋</h1>
              <p className="muted">Manage your career journey in one place.</p>
              <p><strong>Email:</strong> {student?.email || "—"}   <strong>Target career:</strong> {student?.targetCareer || "Not selected"}   <strong>Semester:</strong> {student?.semester || "—"}</p>
            </div>
            <button className="button button-primary" onClick={goToAssessmentFromDashboard}>Take an assessment →</button>
          </div>

          <div className="dashboard-tabs" role="navigation" aria-label="Student dashboard sections">
            {[
              ["overview", "Overview"],
              ["roadmap", "My Roadmap"],
              ["internships", "Internships"],
              ["certificates", "Certificates"],
            ].map(([value, label]) => (
              <button key={value} className={`button ${dashboardTab === value ? "button-primary" : "button-outline"}`} onClick={() => setDashboardTab(value)}>{label}</button>
            ))}
            <button className="button button-outline" onClick={loadStudentDashboard}>↻ Refresh</button>
          </div>

          {dashboardError && <div className="alert alert-error" role="alert">{dashboardError}</div>}
          {dashboardLoading ? (
            <div className="student-panel student-loading"><div className="loader" /><p>Loading your dashboard...</p></div>
          ) : (
            <>
              {dashboardTab === "overview" && (
                <>
                  <div className="student-stat-grid">
                    <article className="student-stat-card"><span className="student-stat-icon">◎</span><div><strong>{dashboardHistory.length}</strong><span>Assessments completed</span></div></article>
                    <article className="student-stat-card"><span className="student-stat-icon">✦</span><div><strong>{dashboardHistory[0]?.results?.[0]?.matchPercentage != null ? `${dashboardHistory[0].results[0].matchPercentage}%` : "—"}</strong><span>Latest top match</span></div></article>
                    <article className="student-stat-card"><span className="student-stat-icon">✓</span><div><strong>{roadmap ? `${roadmapPercentage}%` : "—"}</strong><span>Roadmap progress</span></div></article>
                    <article className="student-stat-card"><span className="student-stat-icon">▤</span><div><strong>{certificates.length}</strong><span>Certificates saved</span></div></article>
                  </div>

                  <section className="student-panel">
                    <div className="student-panel-heading"><div><span className="eyebrow">CAREER DISCOVERY</span><h2>Your latest recommendation</h2></div></div>
                    {dashboardHistory[0]?.results?.length ? (
                      <div className="student-featured-career">
                        <div className="student-featured-icon">✦</div>
                        <div className="student-featured-content">
                          <h3>{dashboardHistory[0].results[0].careerTitle}</h3>
                          <p>{dashboardHistory[0].results[0].explanation || "Explore this career to learn about its skills and opportunities."}</p>
                          <div className="match-track"><div style={{ width: `${Math.max(0, Math.min(100, dashboardHistory[0].results[0].matchPercentage || 0))}%` }} /></div>
                          <small>{dashboardHistory[0].results[0].matchPercentage}% match based on your latest assessment</small>
                        </div>
                      </div>
                    ) : (
                      <div className="student-empty"><h3>Your career journey starts here</h3><p>Complete your first assessment to see recommendations.</p><button className="button button-primary" onClick={goToAssessmentFromDashboard}>Start assessment →</button></div>
                    )}
                  </section>

                  <section className="student-panel">
                    <div className="student-panel-heading"><div><span className="eyebrow">YOUR ACTION PLAN</span><h2>Roadmap snapshot</h2></div><button className="button button-outline" onClick={() => setDashboardTab("roadmap")}>Open roadmap →</button></div>
                    {roadmap ? <><p><strong>{roadmap.targetCareer}</strong> · {completedSteps} of {totalSteps} steps completed</p><div className="match-track"><div style={{ width: `${roadmapPercentage}%` }} /></div></> : <p>Create a roadmap to track your learning goals.</p>}
                  </section>

                  <section className="student-panel">
                    <div className="student-panel-heading"><div><span className="eyebrow">YOUR PROGRESS</span><h2>Assessment history</h2></div></div>
                    {dashboardHistory.length === 0 ? <div className="student-empty"><h3>No assessment history yet</h3><p>Submit an assessment to see saved results here.</p></div> : (
                      <div className="student-history-list">
                        {dashboardHistory.map((item) => (
                          <article className="student-history-item" key={item._id}>
                            <div className="student-history-icon">✓</div>
                            <div className="student-history-content">
                              <h3>Career assessment</h3>
                              <p>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p>
                              <small>{item.answers?.length || 0} answers recorded</small>
                              {item.results?.slice(0, 3).map((result, index) => <div className="student-history-result" key={`${item._id}-${index}`}><span>{index + 1}. {result.careerTitle}</span><strong>{result.matchPercentage}%</strong></div>)}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {dashboardTab === "roadmap" && (
                <section className="student-panel">
                  <div className="student-panel-heading">
                    <div><span className="eyebrow">YOUR ACTION PLAN</span><h2>Career learning roadmap</h2><p className="muted">Your changes are saved to your account.</p></div>
                    {roadmap && <button className="button button-outline" onClick={deleteRoadmap}>Delete roadmap</button>}
                  </div>
                  {roadmapError && <div className="alert alert-error" role="alert">{roadmapError}</div>}
                  {roadmapLoading ? <p>Saving roadmap...</p> : roadmap ? (
                    <>
                      <h3>{roadmap.targetCareer}</h3>
                      <p>{completedSteps} of {totalSteps} steps complete ({roadmapPercentage}%)</p>
                      <div className="match-track"><div style={{ width: `${roadmapPercentage}%` }} /></div>
                      <div className="student-roadmap">
                        {(roadmap.steps || []).map((step) => (
                          <label className="roadmap-goal" key={step._id}>
                            <input type="checkbox" checked={Boolean(step.completed)} disabled={roadmapSaving} onChange={() => toggleRoadmapStep(step)} />
                            <span className="roadmap-goal-text"><strong>{step.title}</strong><small>{step.description}</small><small>{step.category}</small></span>
                            <span className="roadmap-check">{step.completed ? "✓" : "○"}</span>
                          </label>
                        ))}
                      </div>
                      {roadmapSaving && <p>Saving progress...</p>}
                    </>
                  ) : (
                    <div className="student-empty"><h3>No roadmap found</h3><p>Create a learning roadmap based on your target career.</p><button className="button button-primary" onClick={createRoadmap} disabled={roadmapLoading}>＋ Create my roadmap</button></div>
                  )}
                </section>
              )}

              {dashboardTab === "internships" && (
                <section className="student-panel">
                  <div className="student-panel-heading"><div><span className="eyebrow">CAREER OPPORTUNITIES</span><h2>Explore internships</h2><p className="muted">Listings are loaded from the CareerPath internships API.</p></div></div>
                  {internshipError && <div className="alert alert-error" role="alert">{internshipError}</div>}
                  <div className="toolbar">
                    <label className="search-box"><span>⌕</span><input value={internshipSearch} onChange={(e) => setInternshipSearch(e.target.value)} placeholder="Search title, company, or skill..." /></label>
                    <button className="button button-outline" onClick={refreshInternships} disabled={internshipsLoading}>{internshipsLoading ? "Loading..." : "Search / Refresh"}</button>
                  </div>
                  {internshipsLoading ? <p>Loading internships...</p> : filteredInternships.length === 0 ? (
                    <div className="student-empty"><h3>No internships found</h3><p>Try another search or check back later.</p></div>
                  ) : (
                    <div className="management-grid">
                      {filteredInternships.map((item) => (
                        <article className="public-career-card" key={item._id}>
                          <div className="public-card-top"><div className="career-symbol">↗</div><span className="category-pill">{item.category || "Internship"}</span></div>
                          <h3>{item.title}</h3>
                          <p className="public-description"><strong>{item.company}</strong></p>
                          <p className="public-description">{item.description}</p>
                          <div className="skill-list">{(item.skills || []).map((skill) => <span key={skill}>{skill}</span>)}</div>
                          <p><strong>Mode:</strong> {item.mode || "Not specified"}</p>
                          <p><strong>Location:</strong> {item.location || "Remote"}</p>
                          <p><strong>Stipend:</strong> {item.stipend || "Not specified"}</p>
                          {item.deadline && <p><strong>Deadline:</strong> {new Date(item.deadline).toLocaleDateString()}</p>}
                          {item.applyUrl ? <a className="button button-primary" href={item.applyUrl} target="_blank" rel="noreferrer">View / Apply ↗</a> : <p className="muted">Application link not provided.</p>}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {dashboardTab === "certificates" && (
                <section className="student-panel">
                  <div className="student-panel-heading">
                    <div><span className="eyebrow">YOUR ACHIEVEMENTS</span><h2>My certificates</h2><p className="muted">Manage certificates saved to your student account.</p></div>
                    <button className="button button-primary" onClick={openAddCertificate}>＋ Add certificate</button>
                  </div>
                  {certificateNotice && <div className="alert alert-success" role="status">{certificateNotice}</div>}
                  {certificateError && <div className="alert alert-error" role="alert">{certificateError}</div>}
                  {certificatesLoading ? <p>Loading certificates...</p> : certificates.length === 0 ? (
                    <div className="student-empty"><h3>No certificates saved yet</h3><p>Add your course certificates and track your learning achievements.</p><button className="button button-primary" onClick={openAddCertificate}>Add your first certificate</button></div>
                  ) : (
                    <div className="student-history-list">
                      {certificates.map((certificate) => (
                        <article className="student-history-item" key={certificate._id}>
                          <div className="student-history-icon">✦</div>
                          <div className="student-history-content">
                            <h3>{certificate.title}</h3>
                            <p>{certificate.provider}</p>
                            <small>Status: {certificate.status}</small>
                            {certificate.completionDate && <p>Completion date: {new Date(certificate.completionDate).toLocaleDateString()}</p>}
                            {certificate.certificateUrl && <p><a href={certificate.certificateUrl} target="_blank" rel="noreferrer">Open certificate ↗</a></p>}
                            <div className="card-actions">
                              <button className="button button-outline" onClick={() => openEditCertificate(certificate)}>Edit</button>
                              <button className="button button-outline" onClick={() => deleteCertificate(certificate)}>Delete</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
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
                <button className="button button-primary button-large" onClick={() => scrollTo("careers")}>Explore career paths <span>→</span></button>
                <button className="button button-quiet button-large" onClick={() => scrollTo("assessment")}><span className="play-icon">▶</span> Find your direction</button>
              </div>
              <div className="hero-proof"><div className="avatar-stack"><span>P</span><span>R</span><span>A</span></div><p><strong>Start with curiosity.</strong><br />Build a future that fits you.</p></div>
            </div>
          </section>

          <section className="benefit-strip" aria-label="CareerPath benefits">
            <div><span className="benefit-icon">◎</span><div><strong>Explore possibilities</strong><small>Discover different career paths</small></div></div>
            <div><span className="benefit-icon">⌁</span><div><strong>Know the skills</strong><small>Understand what to learn next</small></div></div>
            <div><span className="benefit-icon">↗</span><div><strong>Move with confidence</strong><small>Make informed career choices</small></div></div>
          </section>

          <section className="careers-section public-careers" id="careers">
            <div className="section-heading"><div><span className="eyebrow">A WORLD OF POSSIBILITIES</span><h2>Explore career paths</h2><p>Get to know roles, essential skills, and where each path could take you.</p></div><span className="section-count">{careers.length} career paths <span>↗</span></span></div>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="public-toolbar">
              <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by role, skill, or interest" /></label>
              <div className="category-filters">{categories.map((category) => <button key={category} className={`filter-chip ${categoryFilter === category ? "active" : ""}`} onClick={() => setCategoryFilter(category)}>{category}</button>)}</div>
            </div>
            {loading ? <div className="empty-state"><div className="loader" /><p>Finding career paths for you…</p></div>
              : filteredCareers.length === 0 ? <div className="empty-state"><h3>No matching career paths</h3><p>Try a different keyword or category.</p><button className="button button-soft" onClick={() => { setSearch(""); setCategoryFilter("All"); }}>Clear filters</button></div>
                : <div className="public-career-grid">{filteredCareers.map((career, index) => renderCareerCard(career, index))}</div>}
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
                    <div className="answer-options">{question.options.map((option) => (
                      <label className={`answer-option ${answers[question.id] === option.category ? "selected" : ""}`} key={option.category}>
                        <input type="radio" name={`question-${question.id}`} value={option.category} checked={answers[question.id] === option.category} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.category }))} />
                        <span>{option.text}</span>
                      </label>
                    ))}</div>
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
                ))}</div> : <p>No recommendations returned. Add careers and try again.</p>}
                <p className="assessment-disclaimer">Match scores indicate how closely your answers align with career interest categories. They are not scientifically validated aptitude predictions.</p>
                <button className="button button-primary" onClick={startAssessment}>Retake assessment</button>{" "}
                <button className="button button-outline" onClick={loadAssessmentHistory}>View history</button>{" "}
                <button className="button button-outline" onClick={() => { if (student) { setDashboardTab("overview"); loadStudentDashboard(); } else { setShowStudentAuth(true); setAuthMode("login"); } }}>Open student dashboard</button>
              </div>
            )}

            {showHistory && (
              <div className="assessment-panel">
                <span className="eyebrow">SAVED ASSESSMENTS</span><h3>Assessment history</h3>
                {historyLoading ? <p>Loading saved assessments...</p> : assessmentHistory.length === 0 ? <p>No saved assessments yet.</p> : (
                  <div className="assessment-results">{assessmentHistory.map((item) => (
                    <article className="result-card" key={item._id}>
                      <h4>Assessment on {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown date"}</h4>
                      <p>{item.answers?.length || 0} answers saved</p>
                      {item.results?.slice(0, 3).map((result, index) => <p key={`${item._id}-${index}`}>{index + 1}. {result.careerTitle} — {result.matchPercentage}% match</p>)}
                    </article>
                  ))}</div>
                )}
                <button className="button button-outline" onClick={() => setShowHistory(false)}>Close history</button>
              </div>
            )}
          </section>
        </main>
      )}

      <footer className="site-footer" id="about">
        <div className="footer-main">
          <a className="brand footer-brand" href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}><span className="brand-mark">C</span><span>Career<span className="brand-accent">Path</span></span></a>
          <p>Helping students discover possibilities and take their next step with confidence.</p>
          <div className="footer-links">
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo("home"); }}>Home</a>
            <a href="#careers" onClick={(e) => { e.preventDefault(); scrollTo("careers"); }}>Career paths</a>
            <a href="#assessment" onClick={(e) => { e.preventDefault(); scrollTo("assessment"); }}>Assessment</a>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 CareerPath. All rights reserved.</span><span>Designed for your next step <span className="footer-heart">✦</span></span></div>
      </footer>

      {/* STUDENT LOGIN / REGISTER MODAL */}
      {showStudentAuth && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !authLoading) setShowStudentAuth(false); }}>
          <div className="dialog login-dialog" role="dialog" aria-modal="true" aria-labelledby="student-auth-title">
            <button type="button" className="dialog-close" onClick={() => setShowStudentAuth(false)} disabled={authLoading} aria-label="Close student login">×</button>
            <div className="dialog-brand"><span className="brand-mark">C</span></div>
            <span className="eyebrow">STUDENT WORKSPACE</span>
            <h2 id="student-auth-title">{authMode === "register" ? "Create your account" : "Welcome back"}</h2>
            <p className="dialog-subtitle">{authMode === "register" ? "Create your CareerPath student profile." : "Log in to continue your career journey."}</p>
            {authMessage && <div className="alert alert-success" role="status">{authMessage}</div>}
            {authError && <div className="alert alert-error" role="alert">{authError}</div>}
            <form className="career-form" onSubmit={handleStudentAuth}>
              {authMode === "register" && <>
                <label>Full name<input name="name" value={studentForm.name} onChange={handleStudentFormChange} placeholder="Enter your name" required /></label>
                <label>Target career<input name="targetCareer" value={studentForm.targetCareer} onChange={handleStudentFormChange} placeholder="e.g. Java Developer" required /></label>
                <label>Current semester<select name="semester" value={studentForm.semester} onChange={handleStudentFormChange} required>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}</select></label>
              </>}
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

      {/* ADMIN LOGIN MODAL */}
      {showLogin && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}>
          <div className="dialog login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <button className="dialog-close" onClick={() => setShowLogin(false)} aria-label="Close login">×</button>
            <div className="dialog-brand"><span className="brand-mark">C</span></div>
            <span className="eyebrow">ADMIN WORKSPACE</span><h2 id="login-title">Welcome back</h2>
            <p className="dialog-subtitle">Open the CareerPath career library manager.</p>
            <form onSubmit={handleLogin} className="career-form">
              <label>Email address<input type="email" placeholder="admin@careerpath.com" required /></label>
              <label>Password<input type="password" placeholder="Enter your password" required /></label>
              <button className="button button-primary button-full" type="submit">Open admin workspace →</button>
            </form>
            <p className="demo-note">Demo interface only: admin credentials are not verified. Add server-side admin authentication before deployment.</p>
          </div>
        </div>
      )}

      {/* ADD / EDIT CAREER MODAL */}
      {showCareerModal && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setShowCareerModal(false); }}>
          <div className="dialog career-dialog" role="dialog" aria-modal="true" aria-labelledby="career-dialog-title">
            <button className="dialog-close" onClick={() => !saving && setShowCareerModal(false)} aria-label="Close form">×</button>
            <span className="eyebrow">{editingId !== null ? "UPDATE CAREER DETAILS" : "GROW THE CAREER LIBRARY"}</span>
            <h2 id="career-dialog-title">{editingId !== null ? "Edit career path" : "Add a career path"}</h2>
            <p className="dialog-subtitle">Changes are sent to your careers API.</p>
            <form className="career-form" onSubmit={handleSaveCareer}>
              <label>Career title<input name="title" value={formCareer.title} onChange={(e) => setFormCareer({ ...formCareer, title: e.target.value })} placeholder="e.g. Software Developer" required /></label>
              <label>Description<textarea name="description" value={formCareer.description} onChange={(e) => setFormCareer({ ...formCareer, description: e.target.value })} rows="3" required /></label>
              <label>Skills <span className="label-hint">Separate with commas</span><input name="skills" value={formCareer.skills} onChange={(e) => setFormCareer({ ...formCareer, skills: e.target.value })} placeholder="Java, SQL, Problem solving" required /></label>
              <div className="form-row">
                <label>Salary range<input name="salary" value={formCareer.salary} onChange={(e) => setFormCareer({ ...formCareer, salary: e.target.value })} placeholder="₹5–12 LPA" required /></label>
                <label>Category<select name="category" value={formCareer.category} onChange={(e) => setFormCareer({ ...formCareer, category: e.target.value })} required>{["Technology", "Analytics", "Data", "Design", "Cloud", "Security", "Management", "Business", "Other"].map((c) => <option key={c}>{c}</option>)}</select></label>
              </div>
              {error && <div className="alert alert-error" role="alert">{error}</div>}
              <div className="dialog-actions">
                <button type="button" className="button button-outline" onClick={() => setShowCareerModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Saving..." : editingId !== null ? "Save changes" : "Add career"} →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CERTIFICATE MODAL */}
      {showCertificateForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !certificateSaving) setShowCertificateForm(false); }}>
          <div className="dialog career-dialog" role="dialog" aria-modal="true" aria-labelledby="certificate-dialog-title">
            <button className="dialog-close" onClick={() => !certificateSaving && setShowCertificateForm(false)} aria-label="Close certificate form">×</button>
            <span className="eyebrow">YOUR ACHIEVEMENTS</span>
            <h2 id="certificate-dialog-title">{editingCertificateId ? "Edit certificate" : "Add a certificate"}</h2>
            <form className="career-form" onSubmit={saveCertificate}>
              <label>Certificate title<input value={certificateForm.title} onChange={(e) => setCertificateForm({ ...certificateForm, title: e.target.value })} placeholder="e.g. Java Programming" required /></label>
              <label>Provider<input value={certificateForm.provider} onChange={(e) => setCertificateForm({ ...certificateForm, provider: e.target.value })} placeholder="e.g. Coursera" required /></label>
              <label>Certificate URL<input type="url" value={certificateForm.certificateUrl} onChange={(e) => setCertificateForm({ ...certificateForm, certificateUrl: e.target.value })} placeholder="https://..." /></label>
              <label>Completion date<input type="date" value={certificateForm.completionDate} onChange={(e) => setCertificateForm({ ...certificateForm, completionDate: e.target.value })} /></label>
              <label>Status<select value={certificateForm.status} onChange={(e) => setCertificateForm({ ...certificateForm, status: e.target.value })}><option>In Progress</option><option>Completed</option></select></label>
              {certificateError && <div className="alert alert-error" role="alert">{certificateError}</div>}
              <div className="dialog-actions">
                <button type="button" className="button button-outline" onClick={() => setShowCertificateForm(false)} disabled={certificateSaving}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={certificateSaving}>{certificateSaving ? "Saving..." : editingCertificateId ? "Save changes" : "Add certificate"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
