import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API_BASE });

function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeOnly(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function FacultyDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'attendance' | 'courses' | 'reports'
  const [lectures, setLectures] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [qr, setQr] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Create lecture form state
  const [lectureForm, setLectureForm] = useState({
    subject_id: "1",
    lecture_date: new Date().toISOString().split("T")[0],
    start_time: "10:00:00",
    end_time: "11:30:00",
  });
  const [createMessage, setCreateMessage] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Status report state
  const [statusList, setStatusList] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Load faculty lectures
  const fetchLectures = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/lectures/my", auth(token));
      const list = data.lectures || [];
      setLectures(list);
      if (list.length > 0 && !selectedLectureId) {
        setSelectedLectureId(String(list[0].id));
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load lectures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [token]);

  // QR countdown timer
  useEffect(() => {
    if (!qr) return;
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(qr.expires_at) - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [qr]);

  // Generate QR session
  const handleGenerateQR = async (lectureIdToUse) => {
    const targetId = lectureIdToUse || selectedLectureId;
    if (!targetId) {
      setMessage("Please select a lecture first.");
      return;
    }
    setMessage("");
    try {
      const { data } = await api.post(
        "/qr-session/create",
        { lecture_id: Number(targetId) },
        auth(token)
      );
      setQr(data);
      setSelectedLectureId(String(targetId));
      setRemaining(Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 1000)));
      setActiveTab("attendance");
    } catch (err) {
      setMessage(err.response?.data?.message || "QR Generation failed.");
    }
  };

  // Create lecture
  const handleCreateLecture = async (e) => {
    e.preventDefault();
    setCreateMessage("");
    setCreateLoading(true);
    try {
      const { data } = await api.post(
        "/lectures/create",
        {
          ...lectureForm,
          subject_id: Number(lectureForm.subject_id),
        },
        auth(token)
      );
      setCreateMessage(data.message || "Lecture scheduled successfully.");
      await fetchLectures();
      // Auto select newly created lecture
      if (data.lecture_id) {
        setSelectedLectureId(String(data.lecture_id));
      }
    } catch (err) {
      setCreateMessage(err.response?.data?.message || "Could not create lecture.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Load status for selected lecture
  const handleLoadStatus = async (lectureIdToUse) => {
    const targetId = lectureIdToUse || selectedLectureId;
    if (!targetId) return;
    setStatusLoading(true);
    setStatusMessage("");
    try {
      const { data } = await api.get(`/attendance/lecture/${targetId}`, auth(token));
      setStatusList(data.attendance || []);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || "Failed to load attendance roster.");
    } finally {
      setStatusLoading(false);
    }
  };

  // When switching to reports tab, automatically load status for current selected lecture
  useEffect(() => {
    if (activeTab === "reports" && selectedLectureId) {
      handleLoadStatus(selectedLectureId);
    }
  }, [activeTab, selectedLectureId]);

  const nextLecture = lectures[0] || null;
  const totalClasses = lectures.length;
  const selectedLectureObj = lectures.find((l) => String(l.id) === String(selectedLectureId)) || nextLecture;

  const copyToken = () => {
    if (!qr?.session_token) return;
    navigator.clipboard?.writeText(qr.session_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todayFormatted = formatDateDisplay(new Date());

  // Greeting title formatting
  const nameParts = user.full_name?.split(" ") || ["Professor"];
  const titlePrefix = user.full_name?.includes("Dr.") ? "" : "Prof. ";
  const greetingName = `${titlePrefix}${nameParts[nameParts.length - 1]}`;

  return (
    <div className="text-on-surface font-body-md text-body-md antialiased min-h-screen bg-[#F5F2EA]">
      {/* TopAppBar */}
      <header className="bg-surface-bright h-16 sticky top-0 z-40 border-b border-border-default flex justify-between items-center w-full px-4 md:pl-72 md:pr-margin-desktop">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-text-muted hover:text-primary rounded focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
          <div className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
            LectureLog
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-text-muted cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined hover:text-primary transition-colors" title="Notifications">
              notifications
            </span>
            <span
              className="material-symbols-outlined hover:text-primary transition-colors"
              title="Attendance History"
              onClick={() => setActiveTab("reports")}
            >
              history_edu
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary font-bold border border-border-default flex items-center justify-center text-xs">
              {user.full_name?.charAt(0) || "P"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-primary leading-tight">{user.full_name}</span>
              <span className="text-[11px] text-text-muted leading-tight uppercase tracking-wider font-semibold">
                {user.role} PORTAL
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <nav
        className={`bg-surface-warm h-screen w-64 fixed left-0 top-0 border-r border-border-default flex flex-col py-margin-desktop z-50 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight mb-1 text-2xl font-bold">
              LectureLog
            </h1>
            <p className="font-body-md text-sm text-text-muted">Premium Academic Suite</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-text-muted hover:text-primary p-1"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          {/* Dashboard Tab */}
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 ${
              activeTab === "dashboard"
                ? "text-secondary bg-secondary/5 border-secondary font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "dashboard" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              dashboard
            </span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </button>

          {/* Attendance / QR Tab */}
          <button
            onClick={() => {
              setActiveTab("attendance");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 ${
              activeTab === "attendance"
                ? "text-secondary bg-secondary/5 border-secondary font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "attendance" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              calendar_today
            </span>
            <span className="font-label-md text-label-md">Generate QR</span>
          </button>

          {/* Courses / Create Lecture Tab */}
          <button
            onClick={() => {
              setActiveTab("courses");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 ${
              activeTab === "courses"
                ? "text-secondary bg-secondary/5 border-secondary font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "courses" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              school
            </span>
            <span className="font-label-md text-label-md">Create Lecture</span>
          </button>

          {/* Reports / Attendance Status Tab */}
          <button
            onClick={() => {
              setActiveTab("reports");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 ${
              activeTab === "reports"
                ? "text-secondary bg-secondary/5 border-secondary font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "reports" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bar_chart
            </span>
            <span className="font-label-md text-label-md">Attendance Roster</span>
          </button>
        </div>

        <div className="px-6 mt-auto">
          <button
            onClick={() => {
              if (nextLecture) {
                handleGenerateQR(nextLecture.id);
              } else {
                setActiveTab("attendance");
              }
              setMobileMenuOpen(false);
            }}
            className="w-full bg-secondary text-white font-label-md text-label-md py-2.5 px-4 rounded hover:bg-secondary/90 transition-colors mb-6 shadow-sm active:scale-[0.99] font-medium"
          >
            Start Attendance
          </button>

          <div className="flex flex-col gap-1 border-t border-border-default pt-4">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-error transition-colors text-left w-full"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile scrim overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content Canvas */}
      <main className="md:ml-64 p-margin-mobile md:p-margin-desktop max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-lg gap-4">
          <div>
            <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-2">
              {todayFormatted}
            </p>
            <h2 className="font-serif-display text-[36px] md:text-[42px] leading-[48px] text-primary">
              Good morning, {greetingName}.
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              Live Academic Session
            </span>
          </div>
        </div>

        {/* ================= TAB 1: DASHBOARD BENTO GRID ================= */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Next Lecture Card (Featured) */}
            <div className="md:col-span-8 bg-surface-warm border border-border-default rounded p-6 flex flex-col justify-between min-h-[280px] shadow-sm">
              {nextLecture ? (
                <>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold uppercase tracking-wider">
                        Next Lecture
                      </span>
                      <span className="font-label-md text-label-md text-text-muted flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {nextLecture.start_time} - {nextLecture.end_time}
                      </span>
                    </div>
                    <h3 className="font-headline-lg text-2xl md:text-3xl font-bold text-primary mb-2">
                      {nextLecture.subject_name}
                    </h3>
                    <p className="font-body-lg text-on-surface-variant mb-6 text-sm md:text-base">
                      {nextLecture.subject_code} • {formatShortDate(nextLecture.lecture_date)} • Lecture #{nextLecture.id}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-default pt-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="material-symbols-outlined text-base">group</span>
                      <span>Ready for check-in</span>
                    </div>
                    <button
                      onClick={() => handleGenerateQR(nextLecture.id)}
                      className="bg-secondary text-white font-label-md text-label-md py-2 px-6 rounded hover:bg-secondary/90 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">qr_code_2</span>
                      Start Attendance
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-text-muted">
                  <span className="material-symbols-outlined text-4xl mb-2 text-text-muted">event_busy</span>
                  <p className="font-semibold text-primary mb-1">No scheduled lectures found</p>
                  <p className="text-sm mb-4">Create your first class to open an attendance session.</p>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="bg-secondary text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Create Class
                  </button>
                </div>
              )}
            </div>

            {/* Teaching Summary */}
            <div className="md:col-span-4 bg-surface-warm border border-border-default rounded p-6 flex flex-col shadow-sm">
              <h3 className="font-headline-md text-lg font-bold text-primary mb-4 border-b border-border-default pb-2">
                Overview
              </h3>
              <div className="flex-1 flex flex-col justify-center gap-6">
                <div>
                  <p className="font-label-md text-label-md text-text-muted mb-1">Assigned Classes</p>
                  <p className="font-display-lg text-4xl font-bold text-primary">{totalClasses}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container p-3 rounded">
                    <p className="font-label-sm text-label-sm text-text-muted mb-1 text-xs">Status</p>
                    <p className="font-headline-md text-headline-md text-success font-bold text-base">Active</p>
                  </div>
                  <div className="bg-surface-container p-3 rounded">
                    <p className="font-label-sm text-label-sm text-text-muted mb-1 text-xs">Portal</p>
                    <p className="font-headline-md text-headline-md text-primary font-bold text-base">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Schedule List */}
            <div className="md:col-span-12 bg-surface-warm border border-border-default rounded overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border-default bg-surface-container-low flex justify-between items-center">
                <h3 className="font-headline-md text-lg font-bold text-primary">Your Scheduled Lectures</h3>
                <button
                  onClick={() => setActiveTab("courses")}
                  className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> New Lecture
                </button>
              </div>
              <div className="flex flex-col divide-y divide-border-default">
                {lectures.length > 0 ? (
                  lectures.map((lecture, index) => {
                    const isNext = index === 0;
                    return (
                      <div
                        key={lecture.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors ${
                          isNext
                            ? "bg-surface-container-lowest border-l-4 border-l-secondary"
                            : "hover:bg-surface-container/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded flex items-center justify-center ${
                              isNext ? "bg-secondary/10 text-secondary" : "bg-surface-variant text-on-surface-variant"
                            }`}
                          >
                            <span className="material-symbols-outlined">
                              {isNext ? "play_arrow" : "schedule"}
                            </span>
                          </div>
                          <div>
                            <p className="font-headline-md font-bold text-primary text-base">
                              {lecture.subject_name}
                            </p>
                            <p className="font-body-md text-sm text-text-muted">
                              {lecture.subject_code} • {lecture.start_time} - {lecture.end_time} • {formatShortDate(lecture.lecture_date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span
                            className={`font-label-sm text-xs px-2.5 py-1 rounded font-semibold uppercase tracking-wider ${
                              isNext
                                ? "bg-secondary/10 text-secondary"
                                : "bg-surface-variant text-on-surface-variant"
                            }`}
                          >
                            {isNext ? "Next" : "Scheduled"}
                          </span>

                          <button
                            onClick={() => handleGenerateQR(lecture.id)}
                            className="text-xs bg-secondary text-white px-3 py-1.5 rounded hover:bg-secondary/90 transition-colors font-medium flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">qr_code_2</span>
                            Launch QR
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLectureId(String(lecture.id));
                              setActiveTab("reports");
                            }}
                            className="text-xs border border-border-default bg-surface-container px-3 py-1.5 rounded hover:bg-border-default transition-colors text-primary font-medium"
                          >
                            Roster
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-text-muted">
                    No lectures found. Click "New Lecture" to add one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: GENERATE QR CHECK-IN ================= */}
        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Left selector card */}
            <div className="md:col-span-6 bg-surface-warm border border-border-default rounded p-6 flex flex-col justify-between shadow-sm">
              <div>
                <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold uppercase tracking-wider mb-3 inline-block">
                  Live Check-in
                </span>
                <h3 className="font-headline-lg text-2xl font-bold text-primary mb-2">
                  Generate Attendance QR
                </h3>
                <p className="text-text-muted text-sm mb-6">
                  Select a class to generate a secure, time-limited 5-minute QR session.
                </p>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Select Lecture
                  </label>
                  <select
                    value={selectedLectureId}
                    onChange={(e) => setSelectedLectureId(e.target.value)}
                    className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-sm"
                  >
                    {lectures.map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.subject_code} • {lec.subject_name} ({formatShortDate(lec.lecture_date)} {lec.start_time})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLectureObj && (
                  <div className="bg-surface-container p-4 rounded border-l-4 border-l-secondary mb-6 text-sm">
                    <p className="font-bold text-primary">{selectedLectureObj.subject_name}</p>
                    <p className="text-text-muted text-xs mt-1">
                      Code: {selectedLectureObj.subject_code} • Time: {selectedLectureObj.start_time} - {selectedLectureObj.end_time}
                    </p>
                  </div>
                )}

                {message && (
                  <div className="p-3 bg-error-container/20 text-error border border-error/30 rounded text-sm mb-4">
                    {message}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleGenerateQR(selectedLectureId)}
                className="w-full bg-secondary text-white font-label-md py-3 px-6 rounded hover:bg-secondary/90 transition-colors shadow flex items-center justify-center gap-2 font-semibold"
              >
                <span className="material-symbols-outlined">qr_code_2</span>
                {qr ? "Regenerate QR Session" : "Generate Live QR Code"}
              </button>
            </div>

            {/* Right QR Display Card */}
            <div className="md:col-span-6 bg-surface-warm border border-border-default rounded p-6 flex flex-col items-center justify-center text-center shadow-sm min-h-[420px]">
              {qr ? (
                <div className="flex flex-col items-center w-full max-w-sm">
                  {/* Countdown header */}
                  <div className="flex items-center justify-between w-full mb-3 px-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      Active Session
                    </span>
                    <span className="font-mono font-bold text-secondary text-sm">
                      {formatTimeOnly(remaining)} remaining
                    </span>
                  </div>

                  {/* QR frame */}
                  <div className="p-3 bg-white border-2 border-border-default rounded-lg shadow-sm mb-4">
                    <img
                      src={qr.qr_code}
                      alt="Attendance QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>

                  {/* Manual token row */}
                  <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-1.5 self-start">
                    Manual Session Token
                  </p>
                  <div className="flex items-center w-full gap-2 bg-white border border-border-default p-2 rounded">
                    <code className="text-xs font-mono text-primary flex-1 truncate select-all">
                      {qr.session_token}
                    </code>
                    <button
                      onClick={copyToken}
                      className="p-1.5 hover:bg-surface-container rounded text-text-muted hover:text-primary transition-colors"
                      title="Copy Token"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copied ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                  {copied && (
                    <span className="text-xs text-success font-semibold mt-1 self-end">Copied!</span>
                  )}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center text-text-muted">
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-4 text-text-muted">
                    <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                  </div>
                  <h4 className="font-bold text-primary text-base mb-1">Your QR code will appear here</h4>
                  <p className="text-xs max-w-xs text-text-muted">
                    Click "Generate Live QR Code" to launch a 5-minute attendance window.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CREATE LECTURE ================= */}
        {activeTab === "courses" && (
          <div className="max-w-2xl mx-auto bg-surface-warm border border-border-default rounded p-8 shadow-sm">
            <div className="border-b border-border-default pb-4 mb-6">
              <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold uppercase tracking-wider mb-2 inline-block">
                Course Management
              </span>
              <h3 className="font-headline-lg text-2xl font-bold text-primary">Schedule New Lecture</h3>
              <p className="text-text-muted text-sm mt-1">
                Add an upcoming class to your timetable before generating its attendance QR.
              </p>
            </div>

            <form onSubmit={handleCreateLecture} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                  Subject ID
                </label>
                <input
                  type="number"
                  required
                  value={lectureForm.subject_id}
                  onChange={(e) => setLectureForm({ ...lectureForm, subject_id: e.target.value })}
                  placeholder="e.g. 1 (1 = Demo Subject, 2 = CS-202)"
                  className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-sm"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Default subjects in database: 1 (DEMO-101: Intro to CS), 2 (CS-202: DSA)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                  Lecture Date
                </label>
                <input
                  type="date"
                  required
                  value={lectureForm.lecture_date}
                  onChange={(e) => setLectureForm({ ...lectureForm, lecture_date: e.target.value })}
                  className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={lectureForm.start_time}
                    onChange={(e) => setLectureForm({ ...lectureForm, start_time: e.target.value })}
                    className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={lectureForm.end_time}
                    onChange={(e) => setLectureForm({ ...lectureForm, end_time: e.target.value })}
                    className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-sm"
                  />
                </div>
              </div>

              {createMessage && (
                <div
                  className={`p-3 rounded text-sm ${
                    createMessage.includes("success")
                      ? "bg-success/10 text-success border border-success/30"
                      : "bg-error-container/20 text-error border border-error/30"
                  }`}
                >
                  {createMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-secondary text-white font-label-md py-3 px-6 rounded hover:bg-secondary/90 transition-colors shadow font-semibold disabled:opacity-50"
              >
                {createLoading ? "Scheduling..." : "Create Scheduled Lecture"}
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 4: ATTENDANCE STATUS / REPORTS ================= */}
        {activeTab === "reports" && (
          <div className="bg-surface-warm border border-border-default rounded p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border-default pb-4">
              <div>
                <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold uppercase tracking-wider mb-1 inline-block">
                  Live Records
                </span>
                <h3 className="font-headline-lg text-2xl font-bold text-primary">Attendance Roster</h3>
                <p className="text-text-muted text-sm">Review student check-ins for each lecture.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedLectureId}
                  onChange={(e) => {
                    setSelectedLectureId(e.target.value);
                    handleLoadStatus(e.target.value);
                  }}
                  className="p-2.5 bg-white border border-border-default rounded text-primary text-sm flex-1 sm:flex-none"
                >
                  {lectures.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.subject_code} • {lec.subject_name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleLoadStatus(selectedLectureId)}
                  disabled={statusLoading}
                  className="bg-secondary text-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-secondary/90 transition-colors"
                >
                  {statusLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 bg-error-container/20 text-error border border-error/30 rounded text-sm mb-4">
                {statusMessage}
              </div>
            )}

            {/* Attendance Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-xs uppercase tracking-wider text-text-muted">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default text-sm">
                  {statusList.length > 0 ? (
                    statusList.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container/50">
                        <td className="py-3 px-4 font-semibold text-primary">{item.full_name}</td>
                        <td className="py-3 px-4 text-text-muted">{item.email}</td>
                        <td className="py-3 px-4 text-text-muted">
                          {item.attendance_time
                            ? new Date(item.attendance_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-success/10 text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-text-muted">
                        No students have checked in for this lecture yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}