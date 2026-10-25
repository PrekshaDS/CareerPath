
import { useCallback, useEffect, useMemo, useState } from "react";
import "./InternshipPortal.css";

const INTERNSHIPS_API = "http://localhost:5000/api/internships";

function getSavedKey(student) {
  const identity =
    student?.email || student?._id || student?.id || "guest";

  return `careerPathSavedInternships:${identity}`;
}

function formatDeadline(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isExpired(value) {
  if (!value) return false;

  const deadline = new Date(value);

  if (Number.isNaN(deadline.getTime())) return false;

  deadline.setHours(23, 59, 59, 999);

  return deadline < new Date();
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function InternshipPortal({
  student = null,
  onBack,
}) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [savedOnly, setSavedOnly] = useState(false);

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(getSavedKey(student));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(getSavedKey(student));
      setSavedIds(stored ? JSON.parse(stored) : []);
    } catch {
      setSavedIds([]);
    }
  }, [student?.email, student?._id, student?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(
        getSavedKey(student),
        JSON.stringify(savedIds)
      );
    } catch (err) {
      console.error("Could not save internships:", err);
    }
  }, [savedIds, student?.email, student?._id, student?.id]);

  const loadInternships = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (modeFilter !== "All") {
          params.set("mode", modeFilter);
        }

        if (categoryFilter !== "All") {
          params.set("category", categoryFilter);
        }

        const query = params.toString();

        const response = await fetch(
          `${INTERNSHIPS_API}${query ? `?${query}` : ""}`,
          { signal }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || `Request failed (${response.status})`
          );
        }

        setInternships(data.internships || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message ||
              "Unable to load internships. Check your backend connection."
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [search, modeFilter, categoryFilter]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadInternships(controller.signal);

    return () => controller.abort();
  }, [loadInternships]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        internships
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [internships]);

  const filteredInternships = useMemo(() => {
    return internships.filter((item) => {
      const matchesType =
        typeFilter === "All" || item.type === typeFilter;

      const matchesSaved =
        !savedOnly || savedIds.includes(item._id);

      return matchesType && matchesSaved;
    });
  }, [internships, typeFilter, savedOnly, savedIds]);

  const activeCount = internships.filter(
    (item) => item.active !== false && !isExpired(item.deadline)
  ).length;

  const toggleSaved = (id) => {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id]
    );
  };

  return (
    <main className="jobs-page">
      <section className="jobs-hero">
        <div className="jobs-hero-copy">
          <span className="jobs-eyebrow">
            CAREERPATH OPPORTUNITIES
          </span>

          <h1>Find your next opportunity.</h1>

          <p>
            Discover internships, explore required skills, and
            take the next step in your career.
          </p>

          <div className="jobs-hero-stats">
            <div>
              <strong>{activeCount}</strong>
              <span>Active listings</span>
            </div>

            <div>
              <strong>{savedIds.length}</strong>
              <span>Saved by you</span>
            </div>
          </div>
        </div>

        <div className="jobs-hero-art" aria-hidden="true">
          <span className="jobs-art-orbit orbit-one" />
          <span className="jobs-art-orbit orbit-two" />

          <div className="jobs-art-card">
            <span className="jobs-art-icon">↗</span>
            <span>YOUR NEXT CHAPTER</span>
            <strong>Starts here.</strong>
            <small>Learn · Build · Apply</small>
          </div>
        </div>
      </section>

      <div className="jobs-toolbar-heading">
        <div>
          <span className="jobs-eyebrow">EXPLORE</span>
          <h2>Internships for you</h2>
          <p>
            Find opportunities matching your skills and interests.
          </p>
        </div>

        <div className="jobs-heading-actions">
          {onBack && (
            <button
              className="jobs-button jobs-button-ghost"
              onClick={onBack}
            >
              ← Back
            </button>
          )}

          <button
            className="jobs-button jobs-button-ghost"
            onClick={() => loadInternships(new AbortController().signal)}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="jobs-alert jobs-alert-error">
          <strong>Unable to load internships.</strong>
          <p>{error}</p>
          <button
            className="jobs-button jobs-button-ghost"
            onClick={() => loadInternships(new AbortController().signal)}
          >
            Try again
          </button>
        </div>
      )}

      <section className="jobs-filters">
        <label className="jobs-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role, company, or skill..."
            aria-label="Search internships"
          />
        </label>

        <select
          value={modeFilter}
          onChange={(event) => setModeFilter(event.target.value)}
          aria-label="Filter by work mode"
        >
          <option value="All">All work modes</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-site">On-site</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filter by opportunity type"
        >
          <option value="All">All types</option>
          <option value="Internship">Internship</option>
          <option value="Remote Internship">Remote Internship</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </select>

        <button
          className={`jobs-button ${
            savedOnly
              ? "jobs-button-primary"
              : "jobs-button-ghost"
          }`}
          onClick={() => setSavedOnly((current) => !current)}
        >
          {savedOnly ? "♥ Saved only" : "♡ Saved jobs"}
        </button>
      </section>

      {loading ? (
        <div className="jobs-empty">
          <div className="jobs-spinner" />
          <p>Loading internships from MongoDB...</p>
        </div>
      ) : !error && filteredInternships.length === 0 ? (
        <div className="jobs-empty">
          <div className="jobs-empty-icon">⌕</div>
          <h3>No matching internships</h3>
          <p>Try changing your search or filters.</p>

          <button
            className="jobs-button jobs-button-ghost"
            onClick={() => {
              setSearch("");
              setModeFilter("All");
              setCategoryFilter("All");
              setTypeFilter("All");
              setSavedOnly(false);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : !error ? (
        <>
          <p className="jobs-result-count">
            {filteredInternships.length} internship
            {filteredInternships.length === 1 ? "" : "s"} found
          </p>

          <section className="jobs-grid">
            {filteredInternships.map((item) => {
              const expired = isExpired(item.deadline);
              const saved = savedIds.includes(item._id);

              const applyUrl = item.applyUrl || "";
              const canApply =
                !expired &&
                item.active !== false &&
                isValidUrl(applyUrl);

              return (
                <article className="job-card" key={item._id}>
                  <div className="job-card-top">
                    <div className="job-company-mark">
                      {(item.company || "C")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="job-title-area">
                      <span className="job-company">
                        {item.company}
                      </span>
                      <h3>{item.title}</h3>
                    </div>

                    <button
                      className={`job-save-button ${
                        saved ? "is-saved" : ""
                      }`}
                      onClick={() => toggleSaved(item._id)}
                      aria-label={
                        saved
                          ? "Remove saved internship"
                          : "Save internship"
                      }
                      title={
                        saved
                          ? "Remove saved internship"
                          : "Save internship"
                      }
                    >
                      {saved ? "♥" : "♡"}
                    </button>
                  </div>

                  <div className="job-badges">
                    <span>{item.type || "Internship"}</span>
                    <span>{item.mode || "Mode not specified"}</span>
                    {expired && (
                      <span className="job-status-closed">
                        Deadline passed
                      </span>
                    )}
                  </div>

                  <p className="job-description">
                    {item.description}
                  </p>

                  <div className="job-meta">
                    <span>⌖ {item.location || "Not specified"}</span>
                    <span>
                      ₹ {item.stipend || "Not specified"}
                    </span>
                    <span>
                      ◷ Deadline: {formatDeadline(item.deadline)}
                    </span>
                  </div>

                  {item.skills?.length > 0 && (
                    <div className="job-skills">
                      {item.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  )}

                  {item.eligibility && (
                    <p className="job-eligibility">
                      <strong>Eligibility:</strong>{" "}
                      {item.eligibility}
                    </p>
                  )}

                  <div className="job-card-actions">
                    {canApply ? (
                      <a
                        className="jobs-button jobs-button-primary jobs-apply-button"
                        href={applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apply on employer site ↗
                      </a>
                    ) : (
                      <button
                        className="jobs-button jobs-button-ghost"
                        disabled
                      >
                        {expired
                          ? "Deadline passed"
                          : "Application link unavailable"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      ) : null}

      <p className="jobs-disclaimer">
        These listings may include demo records. Verify the employer,
        role, eligibility, and application link before sharing personal
        information. Saved internships are stored in this browser.
      </p>
    </main>
  );
}
