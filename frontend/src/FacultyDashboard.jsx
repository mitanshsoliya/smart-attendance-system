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
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'attendance' | 'courses' | 'schedule' | 'reports' | 'settings'
  const [lectures, setLectures] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [qr, setQr] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  // Schedule tab state
  const [selectedDayIndex, setSelectedDayIndex] = useState(3); // Default Thursday

  // Settings section state
  const [settingsSection, setSettingsSection] = useState("section-profile");
  const [toggleBle, setToggleBle] = useState(true);
  const [toggleGps, setToggleGps] = useState(true);
  const [toggleThreshold, setToggleThreshold] = useState(true);
  const [selectReminder, setSelectReminder] = useState("15");
  const [toggleDigest, setToggleDigest] = useState(true);
  const [toggleReceipt, setToggleReceipt] = useState(true);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdShow, setPwdShow] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

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

  // When switching to reports tab, load status automatically
  useEffect(() => {
    if (activeTab === "reports" && selectedLectureId) {
      handleLoadStatus(selectedLectureId);
    }
  }, [activeTab, selectedLectureId]);

  const nextLecture = lectures[0] || null;
  const totalClasses = lectures.length;
  const selectedLectureObj =
    lectures.find((l) => String(l.id) === String(selectedLectureId)) || nextLecture;

  const copyToken = () => {
    if (!qr?.session_token) return;
    navigator.clipboard?.writeText(qr.session_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todayFormatted = formatDateDisplay(new Date());

  // Formatting Dr. / Prof. Name
  const rawName = user?.full_name || "Dr. Patel";
  const greetingName = rawName.includes("Dr.") || rawName.includes("Prof.") ? rawName : `Dr. ${rawName}`;

  // Schedule Days Data
  const scheduleDays = [
    { name: "Mon", date: 26, dayName: "Monday", count: "2 Lectures" },
    { name: "Tue", date: 27, dayName: "Tuesday", count: "3 Lectures, 1 Lab" },
    { name: "Wed", date: 28, dayName: "Wednesday", count: "2 Lectures" },
    { name: "Thu", date: 29, dayName: "Thursday", count: "3 Lectures" },
    { name: "Fri", date: 30, dayName: "Friday", count: "1 Lecture, 2 Labs" },
    { name: "Sat", date: 31, dayName: "Saturday", count: "No Classes" },
    { name: "Sun", date: 1, dayName: "Sunday", count: "No Classes" },
  ];

  const currentScheduleDay = scheduleDays[selectedDayIndex];

  // Courses Catalog Data
  const facultyCourses = [
    {
      code: "CS-401",
      name: "Database Systems",
      enrolled: 44,
      schedule: "Mon, Thu • 10:00 AM",
      room: "Room 204, Turing Building",
      avgAttendance: "92%",
      status: "Active",
    },
    {
      code: "CS-503",
      name: "Operating Systems",
      enrolled: 38,
      schedule: "Tue, Fri • 01:00 PM",
      room: "Lab 3B, Babbage Block",
      avgAttendance: "88%",
      status: "Active",
    },
    {
      code: "MA-201",
      name: "Mathematics II",
      enrolled: 52,
      schedule: "Mon, Wed • 08:00 AM",
      room: "Room 101, Ramanujan Wing",
      avgAttendance: "94%",
      status: "Active",
    },
    {
      code: "CS-305",
      name: "Computer Networks",
      enrolled: 40,
      schedule: "Thu, Sat • 02:30 PM",
      room: "Room 302, Hopper Tower",
      avgAttendance: "86%",
      status: "Active",
    },
  ];

  return (
    <div className="text-on-surface font-body-md text-body-md antialiased min-h-screen bg-[#F5F2EA]">
      {/* TopAppBar */}
      <header className="bg-surface-warm h-16 sticky top-0 z-40 border-b border-border-default flex justify-between items-center w-full px-4 md:pl-72 md:pr-margin-desktop">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-text-muted hover:text-primary rounded focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
          <div className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight md:hidden">
            LectureLog
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-text-muted cursor-pointer active:opacity-80">
            <span
              className="material-symbols-outlined hover:text-primary transition-colors"
              title="Notifications"
            >
              notifications
            </span>
            <span
              className="material-symbols-outlined hover:text-primary transition-colors"
              title="Attendance Roster"
              onClick={() => setActiveTab("reports")}
            >
              history_edu
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#B85C3A] text-white font-bold border border-border-default flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name.charAt(0) : "P"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-primary leading-tight">
                {user?.full_name || "Dr. Patel"}
              </span>
              <span className="text-[11px] text-text-muted leading-tight uppercase tracking-wider font-semibold">
                FACULTY PORTAL
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
            className="md:hidden text-text-muted hover:text-primary p-1 cursor-pointer"
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
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 cursor-pointer ${
              activeTab === "dashboard"
                ? "text-[#B85C3A] bg-[#B85C3A]/5 border-[#B85C3A] font-semibold"
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

          {/* Attendance / Generate QR Tab */}
          <button
            onClick={() => {
              setActiveTab("attendance");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 cursor-pointer ${
              activeTab === "attendance"
                ? "text-[#B85C3A] bg-[#B85C3A]/5 border-[#B85C3A] font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "attendance" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              calendar_today
            </span>
            <span className="font-label-md text-label-md">Attendance</span>
          </button>

          {/* Courses Tab */}
          <button
            onClick={() => {
              setActiveTab("courses");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 cursor-pointer ${
              activeTab === "courses"
                ? "text-[#B85C3A] bg-[#B85C3A]/5 border-[#B85C3A] font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "courses" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              school
            </span>
            <span className="font-label-md text-label-md">Courses</span>
          </button>

          {/* Schedule Tab */}
          <button
            onClick={() => {
              setActiveTab("schedule");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 cursor-pointer ${
              activeTab === "schedule"
                ? "text-[#B85C3A] bg-[#B85C3A]/5 border-[#B85C3A] font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "schedule" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              event_note
            </span>
            <span className="font-label-md text-label-md">Schedule</span>
          </button>

          {/* Reports / Attendance Roster Tab */}
          <button
            onClick={() => {
              setActiveTab("reports");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 cursor-pointer ${
              activeTab === "reports"
                ? "text-[#B85C3A] bg-[#B85C3A]/5 border-[#B85C3A] font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "reports" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bar_chart
            </span>
            <span className="font-label-md text-label-md">Reports</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => {
              setActiveTab("settings");
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ease-in-out border-l-4 cursor-pointer ${
              activeTab === "settings"
                ? "text-[#B85C3A] bg-[#B85C3A]/5 border-[#B85C3A] font-semibold"
                : "text-on-surface-variant hover:bg-surface-container border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={activeTab === "settings" ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              settings
            </span>
            <span className="font-label-md text-label-md">Settings</span>
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
            className="w-full bg-[#B85C3A] text-white font-label-md text-label-md py-2.5 px-4 rounded hover:bg-[#a05032] transition-colors mb-6 shadow-sm active:scale-[0.99] font-medium cursor-pointer"
          >
            Start Attendance
          </button>

          <div className="flex flex-col gap-1 border-t border-border-default pt-4">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-left w-full cursor-pointer"
            >
              <span className="material-symbols-outlined">help</span>
              <span className="font-label-md text-label-md">Help Center</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-error transition-colors text-left w-full cursor-pointer"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Scrim Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Content Canvas */}
      <main className="md:ml-64 p-margin-mobile md:p-margin-desktop max-w-[1400px] mx-auto min-h-screen pb-24">
        {/* Global Feedback Message */}
        {message && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded flex justify-between items-center text-sm text-primary">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error">info</span>
              {message}
            </span>
            <button
              onClick={() => setMessage("")}
              className="text-text-muted hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
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

            <div className="flex flex-col gap-16">
              {/* Top Section: Next Lecture & Stats */}
              <div className="flex flex-col md:flex-row gap-12">
                {/* Next Lecture (Open Layout) */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-6 mb-4">
                    <span className="text-[#B85C3A] font-label-sm uppercase tracking-wider font-semibold">
                      Next Lecture
                    </span>
                    <span className="font-label-md text-text-muted flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {nextLecture ? `${nextLecture.start_time} - ${nextLecture.end_time}` : "10:00 AM - 11:30 AM"}
                    </span>
                  </div>
                  <h3 className="font-serif-display text-[40px] md:text-[48px] leading-[48px] md:leading-[56px] text-primary mb-2">
                    {nextLecture ? nextLecture.subject_name : "Database Systems"}
                  </h3>
                  <p className="font-body-lg text-on-surface-variant mb-6">
                    {nextLecture ? `${nextLecture.subject_code} • ${formatShortDate(nextLecture.lecture_date)}` : "CS-401 • Room 204, Turing Building"}
                  </p>
                  <hr className="border-t border-border-default my-6" />
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#B85C3A] text-white border-2 border-[#F5F2EA] flex items-center justify-center text-xs font-bold">
                        P
                      </div>
                      <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-[#F5F2EA] flex items-center justify-center text-xs font-medium text-on-surface-variant">
                        +42
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateQR(nextLecture?.id)}
                      className="bg-[#B85C3A] text-white font-label-md text-label-md py-3 px-8 rounded hover:bg-[#a05032] transition-colors shadow-sm cursor-pointer font-semibold"
                    >
                      Start Attendance
                    </button>
                  </div>
                </div>

                {/* Attendance Pulse / Quick Stats */}
                <div className="w-full md:w-1/3 flex flex-col justify-center gap-8 pl-0 md:pl-12 md:border-l border-border-default">
                  <div>
                    <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-1 font-semibold">
                      Total Students Today
                    </p>
                    <p className="font-serif-display text-[48px] leading-[56px] text-primary">128</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-1 font-semibold">
                        Avg. Attendance
                      </p>
                      <p className="font-serif-display text-[32px] leading-[40px] text-primary">92%</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-1 font-semibold">
                        Classes Today
                      </p>
                      <p className="font-serif-display text-[32px] leading-[40px] text-primary">
                        {totalClasses || 3}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agenda View */}
              <div>
                <h3 className="font-serif-display text-[32px] leading-[40px] text-primary mb-8">
                  Agenda
                </h3>
                <div className="relative border-l border-border-default ml-3 pl-8 flex flex-col gap-10">
                  {/* Completed */}
                  <div className="relative opacity-70">
                    <div className="absolute -left-[41px] top-1 bg-[#F5F2EA] p-1">
                      <span className="material-symbols-outlined text-success">check_circle</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <p className="font-serif-display text-2xl text-primary">Mathematics II</p>
                        <p className="font-body-md text-text-muted mt-1">08:00 AM • Room 101</p>
                      </div>
                      <span className="text-success font-label-sm tracking-widest uppercase font-semibold">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Next */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 bg-[#F5F2EA] p-1">
                      <span
                        className="material-symbols-outlined text-[#B85C3A]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        circle
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <p className="font-serif-display text-2xl text-primary">
                          {nextLecture ? nextLecture.subject_name : "Database Systems"}
                        </p>
                        <p className="font-body-md text-text-muted mt-1">
                          {nextLecture ? `${nextLecture.start_time} - ${nextLecture.end_time}` : "10:00 AM • Room 204"}
                        </p>
                      </div>
                      <span className="text-[#B85C3A] font-label-sm tracking-widest uppercase font-semibold">
                        Next
                      </span>
                    </div>
                  </div>

                  {/* Upcoming */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 bg-[#F5F2EA] p-1">
                      <span className="material-symbols-outlined text-text-muted">
                        radio_button_unchecked
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <p className="font-serif-display text-2xl text-primary">Operating Systems</p>
                        <p className="font-body-md text-text-muted mt-1">01:00 PM • Lab 3B</p>
                      </div>
                      <span className="text-text-muted font-label-sm tracking-widest uppercase font-semibold">
                        Upcoming
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduled Lectures List */}
              <div className="bg-surface-warm border border-border-default rounded overflow-hidden shadow-xs">
                <div className="p-5 border-b border-border-default bg-surface-container-low flex justify-between items-center">
                  <div>
                    <h3 className="font-serif-display text-2xl text-primary">Assigned Class Roster</h3>
                    <p className="text-xs text-text-stone">Lectures scheduled under your instructor profile</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="text-xs font-semibold text-[#B85C3A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Schedule Lecture
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-border-default">
                  {lectures.length > 0 ? (
                    lectures.map((lecture, index) => {
                      const isNext = index === 0;
                      return (
                        <div
                          key={lecture.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 transition-colors ${
                            isNext
                              ? "bg-surface-container-lowest border-l-4 border-l-[#B85C3A]"
                              : "hover:bg-surface-container/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded flex items-center justify-center ${
                                isNext ? "bg-[#B85C3A]/10 text-[#B85C3A]" : "bg-surface-variant text-on-surface-variant"
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
                            <button
                              onClick={() => handleGenerateQR(lecture.id)}
                              className="text-xs bg-[#B85C3A] text-white px-3.5 py-2 rounded hover:bg-[#a05032] transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">qr_code_2</span>
                              Launch QR
                            </button>

                            <button
                              onClick={() => {
                                setSelectedLectureId(String(lecture.id));
                                setActiveTab("reports");
                              }}
                              className="text-xs border border-border-default bg-surface-container px-3.5 py-2 rounded hover:bg-border-default transition-colors text-primary font-semibold cursor-pointer"
                            >
                              View Roster
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-text-muted">
                      No lectures created yet. Click "Schedule Lecture" to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: ATTENDANCE / GENERATE QR ================= */}
        {activeTab === "attendance" && (
          <div>
            <div className="mb-8 border-b border-border-default pb-6">
              <p className="font-label-sm text-label-sm text-[#B85C3A] uppercase tracking-wider mb-1 font-semibold">
                Live Check-in Portal
              </p>
              <h1 className="font-serif-display text-4xl text-primary">Generate Attendance QR</h1>
              <p className="font-body-lg text-text-muted mt-1">
                Open a high-security, 5-minute rolling QR session for instant student attendance verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Selector Card */}
              <div className="md:col-span-6 bg-surface-warm border border-border-default rounded p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="mb-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                      Select Target Lecture
                    </label>
                    <select
                      value={selectedLectureId}
                      onChange={(e) => setSelectedLectureId(e.target.value)}
                      className="w-full p-3.5 bg-white border border-border-default rounded text-primary focus:border-[#B85C3A] focus:ring-1 focus:ring-[#B85C3A] outline-none text-sm cursor-pointer"
                    >
                      {lectures.map((lec) => (
                        <option key={lec.id} value={lec.id}>
                          {lec.subject_code} • {lec.subject_name} ({formatShortDate(lec.lecture_date)} {lec.start_time})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedLectureObj && (
                    <div className="bg-surface-container p-4 rounded border-l-4 border-l-[#B85C3A] mb-6 text-sm">
                      <p className="font-bold text-primary text-base">{selectedLectureObj.subject_name}</p>
                      <p className="text-text-muted text-xs mt-1">
                        Course Code: {selectedLectureObj.subject_code} • Scheduled: {selectedLectureObj.start_time} - {selectedLectureObj.end_time}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleGenerateQR(selectedLectureId)}
                  className="w-full bg-[#B85C3A] text-white font-label-md py-3.5 px-6 rounded hover:bg-[#a05032] transition-colors shadow-sm flex items-center justify-center gap-2 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined">qr_code_2</span>
                  {qr ? "Regenerate Live QR Session" : "Generate Live QR Code"}
                </button>
              </div>

              {/* Right QR Display Card */}
              <div className="md:col-span-6 bg-surface-warm border border-border-default rounded p-6 flex flex-col items-center justify-center text-center shadow-xs min-h-[420px]">
                {qr ? (
                  <div className="flex flex-col items-center w-full max-w-sm">
                    <div className="flex items-center justify-between w-full mb-3 px-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        Active Check-in Window
                      </span>
                      <span className="font-mono font-bold text-[#B85C3A] text-sm">
                        {formatTimeOnly(remaining)} remaining
                      </span>
                    </div>

                    <div className="p-4 bg-white border-2 border-border-default rounded-lg shadow-sm mb-4">
                      <img
                        src={qr.qr_code}
                        alt="Attendance QR Code"
                        className="w-56 h-56 object-contain"
                      />
                    </div>

                    <p className="text-xs uppercase tracking-wider text-text-muted font-bold mb-1.5 self-start">
                      Manual Session Token
                    </p>
                    <div className="flex items-center w-full gap-2 bg-white border border-border-default p-2 rounded">
                      <code className="text-xs font-mono text-primary flex-1 truncate select-all">
                        {qr.session_token}
                      </code>
                      <button
                        onClick={copyToken}
                        className="p-1.5 hover:bg-surface-container rounded text-text-muted hover:text-primary transition-colors cursor-pointer"
                        title="Copy Session Token"
                      >
                        <span className="material-symbols-outlined text-base">
                          {copied ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>
                    {copied && (
                      <span className="text-xs text-success font-semibold mt-1 self-end">Token Copied!</span>
                    )}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center text-text-muted">
                    <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-4 text-text-muted">
                      <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                    </div>
                    <h4 className="font-bold text-primary text-base mb-1">Your QR code will render here</h4>
                    <p className="text-xs max-w-xs text-text-muted">
                      Select a lecture and click "Generate Live QR Code" to begin check-in.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: COURSES ================= */}
        {activeTab === "courses" && (
          <div className="flex flex-col gap-10">
            <div className="border-b border-border-default pb-6">
              <p className="font-label-sm text-label-sm text-[#B85C3A] uppercase tracking-wider mb-1 font-semibold">
                Curriculum & Timetable
              </p>
              <h1 className="font-serif-display text-4xl text-primary">Courses & Lecture Management</h1>
              <p className="font-body-lg text-text-muted mt-1">
                Schedule new lecture sessions and review your assigned departmental courses.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Create Lecture Form */}
              <div className="lg:col-span-5 bg-surface-warm border border-border-default rounded p-6 shadow-xs h-fit">
                <h3 className="font-serif-display text-2xl text-primary mb-4 pb-3 border-b border-border-default">
                  Schedule New Lecture
                </h3>

                <form onSubmit={handleCreateLecture} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      Subject ID
                    </label>
                    <input
                      type="number"
                      required
                      value={lectureForm.subject_id}
                      onChange={(e) => setLectureForm({ ...lectureForm, subject_id: e.target.value })}
                      placeholder="e.g. 1 (1 = Demo Subject, 2 = CS-202)"
                      className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-[#B85C3A] focus:ring-1 focus:ring-[#B85C3A] outline-none text-sm"
                    />
                    <span className="text-[11px] text-text-muted mt-1 block">
                      Subject Registry: 1 (DEMO-101: Intro to CS), 2 (CS-202: Data Structures)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                      Lecture Date
                    </label>
                    <input
                      type="date"
                      required
                      value={lectureForm.lecture_date}
                      onChange={(e) => setLectureForm({ ...lectureForm, lecture_date: e.target.value })}
                      className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-[#B85C3A] focus:ring-1 focus:ring-[#B85C3A] outline-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        step="1"
                        required
                        value={lectureForm.start_time}
                        onChange={(e) => setLectureForm({ ...lectureForm, start_time: e.target.value })}
                        className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-[#B85C3A] focus:ring-1 focus:ring-[#B85C3A] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        step="1"
                        required
                        value={lectureForm.end_time}
                        onChange={(e) => setLectureForm({ ...lectureForm, end_time: e.target.value })}
                        className="w-full p-3 bg-white border border-border-default rounded text-primary focus:border-[#B85C3A] focus:ring-1 focus:ring-[#B85C3A] outline-none text-sm"
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
                    className="w-full bg-[#B85C3A] text-white font-label-md py-3 px-6 rounded hover:bg-[#a05032] transition-colors shadow-xs font-semibold cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {createLoading ? "Scheduling..." : "Create Scheduled Class"}
                  </button>
                </form>
              </div>

              {/* Right Column: Assigned Faculty Courses */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <h3 className="font-serif-display text-2xl text-primary">Assigned Departmental Courses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facultyCourses.map((course) => (
                    <div
                      key={course.code}
                      className="bg-surface-warm border border-border-default rounded p-5 flex flex-col justify-between shadow-xs hover:border-[#B85C3A] transition-colors"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs font-bold text-[#B85C3A] bg-[#B85C3A]/10 px-2 py-0.5 rounded">
                            {course.code}
                          </span>
                          <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
                            {course.status}
                          </span>
                        </div>
                        <h4 className="font-serif-display text-xl text-primary font-semibold mb-1">
                          {course.name}
                        </h4>
                        <p className="text-xs text-text-stone mb-3">{course.room}</p>
                      </div>

                      <div className="border-t border-border-default pt-3 mt-2 flex items-center justify-between text-xs">
                        <span className="text-text-muted">
                          <strong className="text-primary">{course.enrolled}</strong> Students
                        </span>
                        <span className="text-text-muted">
                          Avg: <strong className="text-primary">{course.avgAttendance}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SCHEDULE ================= */}
        {activeTab === "schedule" && (
          <div className="flex flex-col gap-8">
            <div className="border-b border-border-default pb-6">
              <p className="font-label-sm text-label-sm text-[#B85C3A] uppercase tracking-wider mb-1 font-semibold">
                Academic Timetable
              </p>
              <h1 className="font-serif-display text-4xl text-primary">Weekly Teaching Schedule</h1>
              <p className="font-body-lg text-text-muted mt-1">
                View your scheduled lectures across the week and launch live attendance check-ins.
              </p>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-default">
              {scheduleDays.map((day, index) => (
                <button
                  key={day.name}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`flex flex-col items-center py-3 px-6 rounded min-w-[90px] cursor-pointer transition-all ${
                    selectedDayIndex === index
                      ? "bg-[#B85C3A] text-white shadow-sm font-semibold"
                      : "bg-surface-warm border border-border-default text-primary hover:bg-surface-container"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider font-mono">{day.name}</span>
                  <span className="font-serif-display text-xl mt-0.5">{day.date}</span>
                </button>
              ))}
            </div>

            {/* Selected Day Agenda */}
            <div className="bg-surface-warm border border-border-default rounded p-6 shadow-xs">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border-default">
                <div>
                  <h3 className="font-serif-display text-2xl text-primary">
                    {currentScheduleDay.dayName} Schedule
                  </h3>
                  <p className="text-xs text-text-stone">{currentScheduleDay.count}</p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#B85C3A] bg-[#B85C3A]/10 px-3 py-1 rounded">
                  August 2026
                </span>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border-default rounded bg-surface-container-low/60 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#B85C3A]/10 text-[#B85C3A] flex items-center justify-center font-bold text-sm">
                      01
                    </div>
                    <div>
                      <h4 className="font-serif-display text-xl text-primary">Database Systems</h4>
                      <p className="text-xs text-text-stone">10:00 AM - 11:30 AM • Room 204, Turing Building</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGenerateQR(nextLecture?.id)}
                    className="bg-[#B85C3A] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#a05032] transition-colors cursor-pointer self-start md:self-auto"
                  >
                    Start Session
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border-default rounded bg-surface-container-low/60 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-surface-container text-primary flex items-center justify-center font-bold text-sm">
                      02
                    </div>
                    <div>
                      <h4 className="font-serif-display text-xl text-primary">Operating Systems Lab</h4>
                      <p className="text-xs text-text-stone">01:00 PM - 03:00 PM • Lab 3B, Babbage Block</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("attendance")}
                    className="border border-border-default bg-white text-primary px-4 py-2 rounded text-xs font-semibold hover:bg-surface-container transition-colors cursor-pointer self-start md:self-auto"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: REPORTS / ATTENDANCE ROSTER ================= */}
        {activeTab === "reports" && (
          <div className="bg-surface-warm border border-border-default rounded p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border-default pb-4">
              <div>
                <span className="bg-[#B85C3A]/10 text-[#B85C3A] font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold uppercase tracking-wider mb-1 inline-block">
                  Live Attendance Ledger
                </span>
                <h3 className="font-serif-display text-3xl text-primary">Attendance Roster</h3>
                <p className="text-text-muted text-sm">Review real-time student check-ins for selected lectures.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedLectureId}
                  onChange={(e) => {
                    setSelectedLectureId(e.target.value);
                    handleLoadStatus(e.target.value);
                  }}
                  className="p-2.5 bg-white border border-border-default rounded text-primary text-sm flex-1 sm:flex-none cursor-pointer"
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
                  className="bg-[#B85C3A] text-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-[#a05032] transition-colors cursor-pointer"
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

            {/* Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default text-xs uppercase tracking-wider text-text-muted">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default text-sm">
                  {statusList.length > 0 ? (
                    statusList.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container/50">
                        <td className="py-3.5 px-4 font-semibold text-primary">{item.full_name}</td>
                        <td className="py-3.5 px-4 text-text-muted font-mono text-xs">{item.email}</td>
                        <td className="py-3.5 px-4 text-text-muted">
                          {item.attendance_time
                            ? new Date(item.attendance_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-success/10 text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-text-muted">
                        No check-ins recorded for this lecture session yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-8">
            <div className="border-b border-border-default pb-6">
              <p className="font-label-sm text-label-sm text-[#B85C3A] uppercase tracking-wider mb-1 font-semibold">
                Portal Configuration
              </p>
              <h1 className="font-serif-display text-4xl text-primary">Faculty Settings</h1>
              <p className="font-body-lg text-text-muted mt-1">
                Manage your academic profile, security credentials, and classroom telemetry parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Navigation Column */}
              <aside className="lg:col-span-3 flex flex-col gap-6">
                <nav className="flex flex-col bg-surface-warm rounded border border-border-default divide-y divide-border-default">
                  <button
                    onClick={() => setSettingsSection("section-profile")}
                    className={`text-left px-5 py-4 flex items-center justify-between group transition-colors cursor-pointer border-l-4 ${
                      settingsSection === "section-profile" || settingsSection === "all"
                        ? "bg-surface-container font-semibold text-primary border-[#B85C3A]"
                        : "text-on-surface-variant border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-[#B85C3A]">badge</span>
                      <span className="font-label-md text-label-md">Profile & Identity</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSettingsSection("section-device")}
                    className={`text-left px-5 py-4 flex items-center justify-between group transition-colors cursor-pointer border-l-4 ${
                      settingsSection === "section-device"
                        ? "bg-surface-container font-semibold text-primary border-[#B85C3A]"
                        : "text-on-surface-variant border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-text-stone">location_searching</span>
                      <span className="font-label-md text-label-md">Telemetry & Hardware</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSettingsSection("section-notifications")}
                    className={`text-left px-5 py-4 flex items-center justify-between group transition-colors cursor-pointer border-l-4 ${
                      settingsSection === "section-notifications"
                        ? "bg-surface-container font-semibold text-primary border-[#B85C3A]"
                        : "text-on-surface-variant border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-text-stone">notifications_active</span>
                      <span className="font-label-md text-label-md">Alerts & Dispatch</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSettingsSection("section-security")}
                    className={`text-left px-5 py-4 flex items-center justify-between group transition-colors cursor-pointer border-l-4 ${
                      settingsSection === "section-security"
                        ? "bg-surface-container font-semibold text-primary border-[#B85C3A]"
                        : "text-on-surface-variant border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-text-stone">shield</span>
                      <span className="font-label-md text-label-md">Security & Password</span>
                    </div>
                  </button>
                </nav>
              </aside>

              {/* Main Settings Content */}
              <main className="lg:col-span-9 flex flex-col gap-10">
                {/* Profile Section */}
                {(settingsSection === "section-profile" || settingsSection === "all") && (
                  <section className="bg-surface-warm border border-border-default rounded p-6 md:p-8 space-y-6">
                    <div className="border-b border-border-default pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-serif-display text-2xl text-primary">Academic Identity</h3>
                        <p className="text-xs text-text-stone mt-0.5">Faculty credentials verified by Registrar</p>
                      </div>
                      <span className="px-2.5 py-1 bg-success/10 text-success rounded text-xs font-semibold uppercase">
                        Active Faculty
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-[#B85C3A] text-white font-bold text-3xl flex items-center justify-center border-2 border-border-default shrink-0">
                        {user?.full_name ? user.full_name.charAt(0) : "P"}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-serif-display text-2xl text-primary">{user?.full_name || "Dr. Patel"}</h4>
                        <p className="text-sm text-text-stone mt-0.5">Senior Professor • Computer Science & Engineering</p>
                        <p className="text-xs font-mono text-text-muted mt-1">{user?.email || "dr.patel@university.edu"}</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Telemetry Section */}
                {(settingsSection === "section-device" || settingsSection === "all") && (
                  <section className="bg-surface-warm border border-border-default rounded p-6 space-y-6">
                    <div className="border-b border-border-default pb-4">
                      <h3 className="font-serif-display text-2xl text-primary">Classroom Telemetry</h3>
                      <p className="text-xs text-text-stone mt-0.5">BLE Beacon & Geofence Verification Controls</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border-default rounded">
                        <div>
                          <label className="font-semibold text-primary text-sm block">BLE Beacon Proximity</label>
                          <p className="text-xs text-text-stone mt-0.5">Broadcast BLE check-in beacon from classroom terminal</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={toggleBle}
                          onChange={(e) => setToggleBle(e.target.checked)}
                          className="w-5 h-5 accent-[#B85C3A] cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border-default rounded">
                        <div>
                          <label className="font-semibold text-primary text-sm block">Geofence Radius Validation</label>
                          <p className="text-xs text-text-stone mt-0.5">Restrict student check-ins to 10m classroom radius</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={toggleGps}
                          onChange={(e) => setToggleGps(e.target.checked)}
                          className="w-5 h-5 accent-[#B85C3A] cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Security Section */}
                {(settingsSection === "section-security" || settingsSection === "all") && (
                  <section className="bg-surface-warm border border-border-default rounded p-6 space-y-6">
                    <div className="border-b border-border-default pb-4">
                      <h3 className="font-serif-display text-2xl text-primary">Security & Credential Updates</h3>
                      <p className="text-xs text-text-stone mt-0.5">Update password and active sessions</p>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-stone uppercase mb-1">Current Password</label>
                        <input
                          type="password"
                          value={currentPwd}
                          onChange={(e) => setCurrentPwd(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-2.5 bg-white border border-border-default rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-stone uppercase mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="New password"
                          className="w-full p-2.5 bg-white border border-border-default rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-stone uppercase mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full p-2.5 bg-white border border-border-default rounded text-sm"
                        />
                      </div>
                    </form>
                  </section>
                )}

                {/* Save Bar */}
                <div className="sticky bottom-4 bg-surface-warm border border-border-default rounded p-4 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-text-stone">Changes cached in buffer.</span>
                  <button
                    onClick={() => {
                      setSavingSettings(true);
                      setTimeout(() => {
                        setSavingSettings(false);
                        setSavedNotice(true);
                        setTimeout(() => setSavedNotice(false), 2500);
                      }, 600);
                    }}
                    className="bg-[#B85C3A] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-[#a05032] transition-colors cursor-pointer"
                  >
                    {savingSettings ? "Saving..." : savedNotice ? "Saved!" : "Save Preferences"}
                  </button>
                </div>
              </main>
            </div>
          </div>
        )}
      </main>

      {/* HELP CENTER MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-warm border border-border-default rounded max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-primary cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-serif-display text-2xl text-primary mb-3">Faculty Help & Guide</h3>
            <p className="text-sm text-text-stone mb-4">
              Welcome to the LectureLog Faculty Suite! Quick steps for taking attendance:
            </p>
            <ol className="list-decimal list-inside text-xs text-text-stone space-y-2 mb-4">
              <li>Click <strong>Start Attendance</strong> or go to <strong>Attendance</strong>.</li>
              <li>Select your class lecture and click <strong>Generate Live QR Code</strong>.</li>
              <li>Display the QR code on your classroom projector or screen.</li>
              <li>Students scan the code to mark attendance; view real-time check-ins under <strong>Reports</strong>.</li>
            </ol>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#B85C3A] text-white py-2.5 rounded text-sm font-semibold cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}