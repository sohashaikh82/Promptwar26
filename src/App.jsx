import { useMemo, useState } from "react";
import "./App.css";

const initialReports = [
  { id: "CS-1042", title: "Overflowing garbage near bus stop", category: "Waste Management", location: "Central Bus Stop", priority: "High", status: "Reported", date: "Today" },
  { id: "CS-1041", title: "Pothole on main road", category: "Road Maintenance", location: "Market Road", priority: "High", status: "Assigned", date: "Today" },
  { id: "CS-1040", title: "Streetlight not working", category: "Electricity", location: "Green Park", priority: "Medium", status: "In Progress", date: "Yesterday" },
  { id: "CS-1039", title: "Water leakage near school", category: "Water Supply", location: "School Junction", priority: "High", status: "Resolved", date: "Yesterday" },
];

export default function App() {
  const [reports, setReports] = useState(initialReports);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [busy, setBusy] = useState(false);
  const [activePage, setActivePage] = useState("Overview");

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === "Reported").length,
    progress: reports.filter(r => r.status === "In Progress" || r.status === "Assigned").length,
    resolved: reports.filter(r => r.status === "Resolved").length,
  }), [reports]);

  const filteredReports = reports.filter(r =>
    (filter === "All" || r.status === filter) &&
    `${r.title} ${r.location} ${r.category} ${r.id}`.toLowerCase().includes(search.toLowerCase())
  );

  const categoryStats = useMemo(() => {
    const totals = reports.reduce((counts, report) => {
      counts[report.category] = (counts[report.category] || 0) + 1;
      return counts;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  function navigateTo(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function analyseComplaint() {
    if (description.trim().length < 8) {
      setNotice("Please describe the issue using at least 8 characters.");
      setNoticeType("error");
      return;
    }
    setBusy(true);
    setNotice("");
    setAnalysis(null);
    try {
      const response = await fetch("/api/analyze-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Analysis failed (HTTP ${response.status}).`);
      if (
        typeof data.summary !== "string" ||
        typeof data.category !== "string" ||
        typeof data.severity !== "string" ||
        !Number.isInteger(data.priorityScore) ||
        data.priorityScore < 0 ||
        data.priorityScore > 100 ||
        typeof data.responsibleDepartment !== "string" ||
        typeof data.explanation !== "string" ||
        typeof data.recommendedAction !== "string"
      ) {
        throw new Error("The analysis service returned an invalid result. Please try again.");
      }
      const priority = data.priorityScore >= 70 ? "High" : data.priorityScore >= 35 ? "Medium" : "Low";
      setAnalysis({ ...data, priority });
      setNotice("Gemini analysis completed. Please review its recommendations.");
      setNoticeType("success");
    } catch (error) {
      const rawMessage = error.message || "Could not analyze this complaint. Please try again.";
      const friendlyMessage = /not configured|Missing Gemini|GEMINI_API_KEY|api key/i.test(rawMessage)
        ? "Gemini is not configured yet. Add a valid GEMINI_API_KEY in the backend .env file, restart the backend, and run the analysis again."
        : rawMessage;
      setNotice(friendlyMessage);
      setNoticeType("error");
    } finally {
      setBusy(false);
    }
  }

  async function submitComplaint(e) {
    e.preventDefault();
    if (description.trim().length < 8 || !location.trim()) {
      setNotice("Enter a detailed description and location.");
      return;
    }

    if (!analysis) {
      setNotice("Analyze this complaint with Gemini before submitting it.");
      setNoticeType("error");
      return;
    }

    const result = analysis;

    const duplicate = reports.find(r =>
      r.location.toLowerCase() === location.trim().toLowerCase() &&
      r.category === result.category &&
      r.status !== "Resolved"
    );

    if (duplicate) {
      setNotice(`Possible duplicate of ${duplicate.id}. Please review before creating another report.`);
      setNoticeType("error");
      return;
    }

    const report = {
      id: `CS-${Date.now().toString().slice(-6)}`,
      title: description.trim().slice(0, 68),
      category: result.category,
      location: location.trim(),
      priority: result.priority,
      status: "Reported",
      date: new Date().toLocaleDateString(),
      photoName: photo?.name || "",
    };

    setReports(old => [report, ...old]);
    setDescription("");
    setLocation("");
    setPhoto(null);
    setAnalysis(null);
    setNotice(`Report ${report.id} created. Department recommendation: ${result.responsibleDepartment}.`);
    setNoticeType("success");
  }

  function updateStatus(id, status) {
    setReports(old => old.map(r => r.id === id ? { ...r, status } : r));
  }

  function loadSampleComplaint() {
    setDescription("An open electrical wire is sparking beside the school entrance and pedestrians are walking nearby.");
    setLocation("School entrance, Sector 4");
    setAnalysis(null);
    setNotice("");
  }

  function renderReportForm() {
    return (
      <section className="panel report-panel" id="report" aria-labelledby="report-heading">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">CITIZEN SERVICES</span>
            <h2 id="report-heading">Report a civic issue</h2>
            <p>Load the sample, analyze it with Gemini, then submit for review.</p>
          </div>
          <span className="heading-icon" aria-hidden="true">＋</span>
        </div>
        <form onSubmit={submitComplaint}>
          <button type="button" className="sample-btn" onClick={loadSampleComplaint} disabled={busy}>
            Try sample complaint
          </button>
          <label htmlFor="issue-description">Issue description</label>
          <textarea id="issue-description" value={description} onChange={e => { setDescription(e.target.value); setAnalysis(null); setNotice(""); }} placeholder="e.g. Garbage is overflowing near the main bus stop..." rows="4" maxLength="1200" minLength="8" required />
          <div className="field-hint">{description.length}/1200 characters</div>
          <label htmlFor="issue-location">Location</label>
          <input id="issue-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Central bus stop, Sector 4" maxLength="180" required />
          <label htmlFor="issue-photo">Photo evidence <span className="optional">(optional)</span></label>
          <input id="issue-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setPhoto(e.target.files?.[0] || null)} />
          <p className="field-hint">Demo only: the photo filename is recorded; image storage is not connected yet.</p>
          <div className="form-buttons">
            <button type="button" className="secondary-btn" onClick={analyseComplaint} disabled={busy} aria-busy={busy}>
              {busy && <span className="loading-spinner" aria-hidden="true" />}
              {busy ? "Analysing with Gemini..." : "✦ Analyse with Gemini"}
            </button>
            <button type="submit" className="primary-btn" disabled={busy}>Submit report <span aria-hidden="true">↗</span></button>
          </div>
        </form>
        {notice && <div className={`notice${noticeType === "error" ? " notice-error" : ""}`} role={noticeType === "error" ? "alert" : "status"}>{notice}</div>}
        {busy && !analysis && (
          <div className="analysis-card analysis-loading" role="status" aria-live="polite">
            <div className="analysis-title">
              Gemini is analysing your complaint<span>…</span>
            </div>
            <p>Reading the civic issue carefully and preparing a cautious recommendation.</p>
          </div>
        )}
        {analysis && (
          <div className="analysis-card" aria-live="polite">
            <div className="analysis-title">
              Gemini analysis <span>{analysis.severity} severity · {analysis.priorityScore}/100</span>
            </div>
            <div className="analysis-urgency">
              <span className={`urgency-badge urgency-${String(analysis.severity).toLowerCase()}`}>
                Urgency: {analysis.severity}
              </span>
              <span className="analysis-priority">
                {analysis.priority} priority · AI priority score {analysis.priorityScore}/100
              </span>
            </div>
            <p><b>Complaint summary:</b> {analysis.summary}</p>
            <p><b>Category:</b> {analysis.category}</p>
            <p><b>Priority:</b> {analysis.priority} ({analysis.priorityScore}/100)</p>
            <p><b>Responsible department:</b> {analysis.responsibleDepartment}</p>
            <p><b>Explanation:</b> {analysis.explanation}</p>
            <p><b>Recommended action:</b> {analysis.recommendedAction}</p>
            <p className="analysis-disclaimer">AI-generated recommendation. Human review is required.</p>
          </div>
        )}
      </section>
    );
  }

  function renderReportsPanel() {
    return (
      <section className="panel reports-panel" aria-labelledby="reports-heading">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">OPERATIONS</span>
            <h2 id="reports-heading">Recent complaints</h2>
            <p>Track and update the demo reports.</p>
          </div>
          <span className="count-badge">{reports.length}</span>
        </div>
        <label className="visually-hidden" htmlFor="complaint-search">Search complaints</label>
        <input id="complaint-search" className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." />
        <div className="filter-row" aria-label="Filter complaints by status">
          {["All", "Reported", "Assigned", "In Progress", "Resolved"].map(s => (
            <button type="button" key={s} onClick={() => setFilter(s)} className={filter === s ? "filter active-filter" : "filter"} aria-pressed={filter === s}>{s}</button>
          ))}
        </div>
        <div className="report-list">
          {filteredReports.map(r => (
            <article className="report-card" key={r.id}>
              <div className="report-card-top">
                <span className={`priority-dot ${r.priority.toLowerCase()}`} aria-hidden="true" />
                <span className="report-id">{r.id}</span>
                <span className={`status-badge status-${r.status.toLowerCase().replace(" ", "-")}`}>{r.status}</span>
              </div>
              <h3>{r.title}</h3>
              <p className="report-location"><span aria-hidden="true">⌖</span> {r.location}</p>
              <div className="report-meta"><span>{r.category}</span><span className={`priority-text ${r.priority.toLowerCase()}`}>{r.priority} priority</span></div>
              <label className="status-label" htmlFor={`status-${r.id}`}>Update status</label>
              <select id={`status-${r.id}`} value={r.status} onChange={e => updateStatus(r.id, e.target.value)} aria-label={`Status for ${r.id}`}>
                {["Reported", "Assigned", "In Progress", "Resolved"].map(s => <option key={s}>{s}</option>)}
              </select>
            </article>
          ))}
          {filteredReports.length === 0 && <div className="empty-state">No matching reports found. Try a different search or status filter.</div>}
        </div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main sidebar">
        <div className="sidebar-top">
          <div className="brand"><span className="brand-icon" aria-hidden="true">C</span><span>CivicSense<span className="brand-ai"> AI</span></span></div>
          <p className="side-caption">CIVIC INTELLIGENCE PLATFORM</p>
          <nav className="sidebar-nav" aria-label="Main navigation">
            {[
              ["Overview", "▦"],
              ["Complaints", "◎"],
              ["AI Insights", "⌁"],
              ["Settings", "⚙"],
            ].map(([page, icon]) => (
              <button type="button" key={page} className={`nav-item${activePage === page ? " active" : ""}`} onClick={() => navigateTo(page)} aria-current={activePage === page ? "page" : undefined}>
                <span className="nav-icon" aria-hidden="true">{icon}</span><span>{page}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom"><span className="online-dot" aria-hidden="true" /><span>Prototype mode</span><small>Local demo environment</small></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / {activePage}</div>
            <h1>{activePage === "Overview" ? "Smart City Command Center" : activePage}</h1>
            <p>{activePage === "Overview" ? "Monitor civic issues. Prioritise action. Improve your community." : pageDescription(activePage)}</p>
          </div>
          <div className="top-actions"><span className="live-pill"><span className="online-dot" aria-hidden="true" /> Demo live</span><div className="avatar" aria-label="CivicSense workspace">CS</div></div>
        </header>

        {activePage === "Overview" && (
          <>
            <section className="welcome-banner">
              <div className="welcome-copy">
                <span className="eyebrow">CIVIC OPERATIONS</span>
                <h2>A better city starts with<br className="desktop-break" /> one reported issue.</h2>
                <p>Turn community complaints into actionable insights.</p>
                <a href="#report" className="primary-link">＋ Report an issue</a>
              </div>
              <div className="banner-art" aria-hidden="true"><div className="art-circle">⌂</div><span className="art-dot dot-one" /><span className="art-dot dot-two" /><span className="art-dot dot-three" /><div className="art-label">SMART CITY<br /><b>INTELLIGENCE</b></div></div>
            </section>
            <section className="stats-grid" aria-label="Complaint statistics">
              <Stat label="Total reports" value={stats.total} icon="▤" detail="All submitted issues" />
              <Stat label="Awaiting review" value={stats.pending} icon="◷" detail="Need attention" />
              <Stat label="Being handled" value={stats.progress} icon="↗" detail="Assigned or in progress" />
              <Stat label="Resolved issues" value={stats.resolved} icon="✓" detail="Marked complete" />
            </section>
            <div className="content-grid">{renderReportForm()}{renderReportsPanel()}</div>
            <section className="panel how-panel" aria-labelledby="how-heading">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">HOW IT WORKS</span>
                  <h2 id="how-heading">From complaint to city action</h2>
                  <p>A simple, transparent loop for civic reporting.</p>
                </div>
              </div>
              <ol className="how-steps">
                <li><b>Describe.</b> Report the issue with a clear description and location.</li>
                <li><b>Analyse.</b> Gemini reviews the complaint and suggests a category, urgency and responsible department.</li>
                <li><b>Act.</b> A human review update closes the loop; AI output stays advisory.</li>
              </ol>
            </section>
          </>
        )}

        {activePage === "Complaints" && (
          <div className="page-content complaints-view">
            <div className="page-actions"><p>Search, filter, and update the status of submitted civic issues.</p><button type="button" className="primary-btn" onClick={() => navigateTo("Overview")}>＋ Report an issue</button></div>
            {renderReportsPanel()}
          </div>
        )}

        {activePage === "AI Insights" && (
          <section className="page-content insights-view" aria-labelledby="insights-heading">
            <div className="panel-heading"><div><span className="section-kicker">REPORTING OVERVIEW</span><h2 id="insights-heading">Community issue insights</h2><p>Live summaries calculated from the current demo complaints.</p></div></div>
            <div className="insights-grid">
              <article className="panel insight-panel">
                <h3>Reports by category</h3>
                {categoryStats.length > 0 ? categoryStats.map(([category, count]) => (
                  <div className="chart-bar-row" key={category}>
                    <span className="chart-bar-label">{category}</span>
                    <span className="chart-bar-track"><span className="chart-bar" style={{ width: `${Math.max((count / stats.total) * 100, 4)}%` }} /></span>
                    <span className="chart-bar-value">{count}</span>
                  </div>
                )) : <p className="empty-state">No reports are available yet.</p>}
              </article>
              <article className="panel insight-panel">
                <h3>Current status</h3>
                <div className="insight-metrics">
                  <p><span>Reported</span><b>{stats.pending}</b></p>
                  <p><span>Assigned or in progress</span><b>{stats.progress}</b></p>
                  <p><span>Resolved</span><b>{stats.resolved}</b></p>
                </div>
                <p className="insight-note">These summaries update as reports are submitted or their statuses change. Recommendations require human review.</p>
              </article>
            </div>
          </section>
        )}

        {activePage === "Settings" && (
          <section className="page-content settings-view" aria-labelledby="settings-heading">
            <div className="panel settings-panel">
              <span className="section-kicker">WORKSPACE</span>
              <h2 id="settings-heading">Settings</h2>
              <p>This prototype stores complaint data in the current page session. No account or external service is configured here.</p>
              <div className="settings-row"><span>Environment</span><b>Local demo</b></div>
              <div className="settings-row"><span>Issue analysis</span><b>Gemini backend endpoint</b></div>
              <div className="settings-row"><span>Photo storage</span><b>Not connected</b></div>
            </div>
          </section>
        )}

        <footer><b>CivicSense AI</b><span>Hackathon prototype · Recommendations require human review.</span></footer>
      </main>
    </div>
  );
}

function pageDescription(page) {
  if (page === "Complaints") return "Review community reports and keep their status up to date.";
  if (page === "AI Insights") return "Understand reported issues with live summaries of your demo data.";
  return "Manage this local CivicSense prototype.";
}

function Stat({ label, value, icon, detail }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon" aria-hidden="true">{icon}</span></div><div className="stat-value">{value}</div><p>{detail}</p></article>;
}