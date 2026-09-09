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

function getQrGraphic(tokenStr = "SESSION-101") {
  const color = "%23B85C3A";
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'><rect width='260' height='260' fill='%23FFFFFF' rx='8'/><g fill='${color}'><rect x='25' y='25' width='60' height='60' rx='4'/><rect x='35' y='35' width='40' height='40' fill='%23FFFFFF'/><rect x='45' y='45' width='20' height='20' rx='2'/><rect x='175' y='25' width='60' height='60' rx='4'/><rect x='185' y='35' width='40' height='40' fill='%23FFFFFF'/><rect x='195' y='45' width='20' height='20' rx='2'/><rect x='25' y='175' width='60' height='60' rx='4'/><rect x='35' y='185' width='40' height='40' fill='%23FFFFFF'/><rect x='45' y='195' width='20' height='20' rx='2'/><rect x='100' y='25' width='45' height='20' rx='2'/><rect x='95' y='55' width='20' height='30' rx='2'/><rect x='125' y='65' width='35' height='20' rx='2'/><rect x='25' y='100' width='30' height='20' rx='2'/><rect x='65' y='95' width='45' height='30' rx='2'/><rect x='120' y='95' width='55' height='20' rx='2'/><rect x='185' y='95' width='50' height='30' rx='2'/><rect x='95' y='135' width='35' height='30' rx='2'/><rect x='140' y='125' width='35' height='25' rx='2'/><rect x='185' y='135' width='45' height='20' rx='2'/><rect x='95' y='175' width='55' height='55' rx='2'/><rect x='105' y='185' width='35' height='35' fill='%23FFFFFF'/><rect x='160' y='165' width='35' height='45' rx='2'/><rect x='205' y='175' width='30' height='55' rx='2'/></g></svg>`;
}

export default function FacultyDashboard({ user, token, onLogout, onToggleRole }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'attendance' | 'courses' | 'schedule' | 'reports' | 'settings'
  const [lectures, setLectures] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [qr, setQr] = useState(null);
  const [remaining, setRemaining] = useState(374); // Default 06:14 in seconds
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showFullscreenQr, setShowFullscreenQr] = useState(false);

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
  const [scheduleView, setScheduleView] = useState("grid"); // 'grid' | 'agenda' | 'office-hours'

  // Attendance Tab Filters & Appeals Queue state
  const [ledgerCourseFilter, setLedgerCourseFilter] = useState("All Assigned Courses");
  const [ledgerSectionFilter, setLedgerSectionFilter] = useState("All Sections");
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("All Statuses");
  const [quickLaunchOpen, setQuickLaunchOpen] = useState(false);

  const [appealsList, setAppealsList] = useState([
    {
      id: "appeal-1",
      name: "Jay Mehta",
      roll: "Roll #2024-CSE-042 • CS501",
      tag: "BLE Timeout",
      tagType: "error",
      quote:
        "Device scanned room QR successfully at 10:04 AM, but local Bluetooth L2CAP handshake timed out on Android 14 client.",
      detail: "Location: Lat 28.545, Long 77.192 (Inside)",
      rssi: "RSSI: -58 dBm",
      status: "pending",
    },
    {
      id: "appeal-2",
      name: "Aarav Shah",
      roll: "Roll #2024-CSE-018 • CS503 Lab",
      tag: "Medical Leave",
      tagType: "secondary",
      quote: "Hospital Slip #MED-8912.pdf — Authorized by Campus Health Center Dr. K. Rao for 28 Aug lab hours.",
      detail: "Requested State: Excused Absence",
      link: "Inspect Document",
      status: "pending",
    },
    {
      id: "appeal-3",
      name: "Pooja Nambiar",
      roll: "Roll #2024-CSE-061 • CS501",
      tag: "Low Match (84%)",
      tagType: "warning",
      quote: "Terminal camera marked confidence at 84% (Threshold: 88%). Low lighting near door station in Room 204.",
      detail: "Timestamp: 10:02:14 AM",
      rssi: "GPS Locked (0m deviation)",
      status: "pending",
    },
  ]);

  // Courses Tab State & Roster Modal
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterModalTitle, setRosterModalTitle] = useState("All Enrolled Students (129 Total)");
  const [rosterModalSubtitle, setRosterModalSubtitle] = useState("Inspect attendance ratios, status flags, and individual biometric verifications");
  const [rosterCourseFilter, setRosterCourseFilter] = useState("ALL");
  const [rosterSearchText, setRosterSearchText] = useState("");

  const [policyExamThreshold, setPolicyExamThreshold] = useState(75);
  const [policyDeanThreshold, setPolicyDeanThreshold] = useState(70);
  const [policyGraceMinutes, setPolicyGraceMinutes] = useState("10");
  const [policyConsecutiveAbsence, setPolicyConsecutiveAbsence] = useState(3);
  const [policyCheckQr, setPolicyCheckQr] = useState(true);
  const [policyCheckBleGps, setPolicyCheckBleGps] = useState(true);
  const [policyCheckFacial, setPolicyCheckFacial] = useState(false);

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
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate QR session
  const handleGenerateQR = async (lectureIdToUse) => {
    const targetId = lectureIdToUse || selectedLectureId || (lectures[0]?.id ? String(lectures[0].id) : "1");
    setMessage("");
    try {
      const { data } = await api.post(
        "/qr-session/create",
        { lecture_id: Number(targetId) },
        auth(token)
      );
      const sessionToken = data.session_token || "LECTURE-" + Math.floor(100000 + Math.random() * 900000);
      setQr({
        ...data,
        session_token: sessionToken,
        qr_code: data.qr_code || getQrGraphic(sessionToken),
      });
      setSelectedLectureId(String(targetId));
      setRemaining(Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 1000) || 600));
      setActiveTab("attendance");
    } catch (err) {
      // Clean fallback for demo / offline
      const fallbackToken = "LECTURE-" + Math.floor(100000 + Math.random() * 900000);
      setQr({
        session_token: fallbackToken,
        qr_code: getQrGraphic(fallbackToken),
        expires_at: new Date(Date.now() + 600000).toISOString(),
      });
      setSelectedLectureId(String(targetId));
      setRemaining(600);
      setActiveTab("attendance");
    }
  };

  useEffect(() => {
    if (activeTab === "attendance" && !qr) {
      const initialId = selectedLectureId || (lectures[0]?.id ? String(lectures[0].id) : "1");
      handleGenerateQR(initialId);
    }
  }, [activeTab]);

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

  const resolveAppeal = (id, resultAction) => {
    setAppealsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: resultAction } : item
      )
    );
  };

  const openRosterModal = (courseCode, courseName, cohort, count) => {
    setRosterModalTitle(`${courseCode} — ${courseName}`);
    setRosterModalSubtitle(`Cohort ${cohort} • ${count} Enrolled Candidates`);
    setRosterCourseFilter(courseCode);
    setRosterSearchText("");
    setShowRosterModal(true);
  };

  const todayFormatted = formatDateDisplay(new Date());
  const rawName = user?.full_name || "Dr. Sarah Jenkins";
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

  // Roster Candidates List
  const cohortCandidates = [
    { roll: "2026-CSE-01", name: "Aarav Sharma", course: "CS501", cohort: "CSE-A", attended: "31 / 32", pct: "96.8%", status: "Exemplary", statusType: "success" },
    { roll: "2026-CSE-22", name: "Marcus Vance", course: "CS503", cohort: "CSE-B", attended: "16 / 24", pct: "66.6%", status: "At Risk (Dean Alert)", statusType: "error" },
    { roll: "2026-CSE-08", name: "Elena Rostova", course: "CS508", cohort: "Elective", attended: "19 / 20", pct: "95.0%", status: "Exemplary", statusType: "success" },
    { roll: "2026-CSE-31", name: "Devon Chu", course: "CS503", cohort: "CSE-B", attended: "17 / 24", pct: "70.8%", status: "Warning Sent", statusType: "warning" },
    { roll: "2026-CSE-14", name: "Priya Nair", course: "CS501", cohort: "CSE-A", attended: "29 / 32", pct: "90.6%", status: "Compliant", statusType: "neutral" },
  ];

  const filteredCandidates = cohortCandidates.filter((cand) => {
    const matchCourse = rosterCourseFilter === "ALL" || cand.course === rosterCourseFilter;
    const matchText =
      !rosterSearchText ||
      cand.name.toLowerCase().includes(rosterSearchText.toLowerCase()) ||
      cand.roll.toLowerCase().includes(rosterSearchText.toLowerCase());
    return matchCourse && matchText;
  });

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
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-border-default bg-surface-container-lowest">
            <span className="material-symbols-outlined text-secondary text-[18px]">event_available</span>
            <span className="font-label-sm text-label-sm text-on-surface">Next: CS-402 at 11:30 AM</span>
          </div>

          <div className="flex items-center gap-4 text-text-muted cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined hover:text-primary transition-colors" title="Notifications">
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
            {onToggleRole && (
              <button
                onClick={() => onToggleRole("STUDENT")}
                className="px-2.5 py-1 text-xs bg-surface-container border border-border-default text-primary hover:bg-surface-container-high rounded font-semibold flex items-center gap-1 cursor-pointer"
                title="Switch to Student Portal View"
              >
                <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                <span className="hidden sm:inline">Student View</span>
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-label-md font-medium tracking-tight border border-secondary">
              {user?.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "SJ"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                {user?.full_name || "Dr. Sarah Jenkins"}
              </span>
              <span className="font-label-sm text-label-sm text-text-stone leading-tight">
                Professor, CSE Department
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <nav
        className={`bg-surface-warm h-screen w-64 fixed left-0 top-0 border-r border-border-default flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          <div className="h-16 px-6 flex flex-col justify-center border-b border-border-default">
            <span className="font-greeting-serif text-headline-md tracking-tight text-on-surface leading-none font-bold">
              LectureLog
            </span>
            <span className="font-label-sm text-label-sm text-text-stone tracking-wider uppercase mt-1">
              Faculty Academic Portal
            </span>
          </div>

          <div className="p-4 border-b border-border-default">
            <button
              onClick={() => {
                if (nextLecture) {
                  handleGenerateQR(nextLecture.id);
                } else {
                  setActiveTab("attendance");
                }
                setMobileMenuOpen(false);
              }}
              className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-2.5 px-4 rounded-none hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium tracking-wide shadow-none cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>Start Attendance</span>
            </button>
          </div>

          <div className="py-3 flex flex-col">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center gap-3 ${
                activeTab === "dashboard"
                  ? "border-secondary bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("attendance");
                setMobileMenuOpen(false);
              }}
              className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center gap-3 ${
                activeTab === "attendance"
                  ? "border-secondary bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
              <span>Attendance</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("courses");
                setMobileMenuOpen(false);
              }}
              className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center gap-3 ${
                activeTab === "courses"
                  ? "border-secondary bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>Courses</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("schedule");
                setMobileMenuOpen(false);
              }}
              className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center gap-3 ${
                activeTab === "schedule"
                  ? "border-secondary bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>Schedule</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("reports");
                setMobileMenuOpen(false);
              }}
              className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center gap-3 ${
                activeTab === "reports"
                  ? "border-secondary bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span>Reports</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setMobileMenuOpen(false);
              }}
              className={`px-6 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center gap-3 ${
                activeTab === "settings"
                  ? "border-secondary bg-surface-container text-on-surface font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-border-default flex flex-col gap-1">
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors text-left flex items-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span>Help Center</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors text-left flex items-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out</span>
          </button>
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
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-6 mb-4">
                    <span className="text-secondary font-label-sm uppercase tracking-wider font-semibold">
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
                      <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary border-2 border-[#F5F2EA] flex items-center justify-center text-xs font-bold">
                        P
                      </div>
                      <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-[#F5F2EA] flex items-center justify-center text-xs font-medium text-on-surface-variant">
                        +42
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateQR(nextLecture?.id)}
                      className="bg-secondary text-on-secondary font-label-md text-label-md py-3 px-8 rounded hover:opacity-90 transition-colors shadow-sm cursor-pointer font-semibold"
                    >
                      Start Attendance
                    </button>
                  </div>
                </div>

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

              <div>
                <h3 className="font-serif-display text-[32px] leading-[40px] text-primary mb-8">
                  Agenda
                </h3>
                <div className="relative border-l border-border-default ml-3 pl-8 flex flex-col gap-10">
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

                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 bg-[#F5F2EA] p-1">
                      <span
                        className="material-symbols-outlined text-secondary"
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
                      <span className="text-secondary font-label-sm tracking-widest uppercase font-semibold">
                        Next
                      </span>
                    </div>
                  </div>

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
            </div>
          </>
        )}

        {/* ================= TAB 2: ATTENDANCE & SESSIONS OVERVIEW ================= */}
        {activeTab === "attendance" && (
          <div className="flex flex-col w-full">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border-default">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container font-label-sm text-label-sm text-text-stone uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Autumn Semester 2026
                  </span>
                  <span className="text-border-default">/</span>
                  <span className="font-label-sm text-label-sm text-text-stone">CSE Dept • Room Allocation Desk</span>
                </div>
                <h1 className="font-greeting-serif text-headline-lg lg:text-greeting-serif text-on-surface tracking-tight leading-none font-bold">
                  Attendance Overview & Sessions
                </h1>
                <p className="font-body-md text-body-md text-text-stone mt-3 max-w-xl">
                  Manage live roll calls, verification audits, and historical session registers across assigned course sections.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => alert("Exporting session ledger CSV...")}
                  className="px-4 py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-2 border border-border-default active:scale-[0.98] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-stone">file_download</span>
                  <span>Export Session CSV</span>
                </button>
                <button
                  onClick={() => alert("Bulk attendance override window opened.")}
                  className="px-4 py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-2 border border-border-default active:scale-[0.98] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-stone">rule</span>
                  <span>Bulk Override</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setQuickLaunchOpen(!quickLaunchOpen)}
                    className="px-5 py-2.5 bg-secondary text-on-secondary hover:opacity-95 transition-all font-label-md text-label-md flex items-center gap-2 active:scale-[0.98] shadow-sm cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span className="font-semibold tracking-wide">+ Launch New Session</span>
                    <span className="material-symbols-outlined text-[18px] ml-0.5">expand_more</span>
                  </button>

                  {quickLaunchOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-surface-warm border border-border-default shadow-lg z-30 py-1">
                      <div className="px-3 py-1.5 font-label-sm text-label-sm text-text-stone uppercase tracking-wider border-b border-border-default">
                        Quick Launch
                      </div>
                      <button
                        onClick={() => {
                          setQuickLaunchOpen(false);
                          handleGenerateQR(lectures[0]?.id);
                        }}
                        className="flex flex-col px-4 py-2 hover:bg-surface-container transition-colors w-full text-left cursor-pointer"
                      >
                        <span className="font-label-md text-label-md text-on-surface font-medium">
                          Database Systems (CS501)
                        </span>
                        <span className="font-label-sm text-label-sm text-text-stone">CSE-A • Room 204</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickLaunchOpen(false);
                          handleGenerateQR(lectures[1]?.id || lectures[0]?.id);
                        }}
                        className="flex flex-col px-4 py-2 hover:bg-surface-container transition-colors w-full text-left cursor-pointer"
                      >
                        <span className="font-label-md text-label-md text-on-surface font-medium">
                          Operating Systems Lab (CS503)
                        </span>
                        <span className="font-label-sm text-label-sm text-text-stone">CSE-B • Lab 3</span>
                      </button>
                      <button
                        onClick={() => {
                          setQuickLaunchOpen(false);
                          setActiveTab("courses");
                        }}
                        className="flex flex-col px-4 py-2 hover:bg-surface-container transition-colors border-t border-border-default w-full text-left cursor-pointer"
                      >
                        <span className="font-label-md text-label-md text-secondary font-medium">
                          + Custom Roster Configuration
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-surface-warm border border-border-default p-6 relative overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                      </span>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                        Live QR Attendance Session Active
                      </span>
                      <span className="text-border-default">•</span>
                      <span className="font-label-sm text-label-sm text-text-stone">{todayFormatted}</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                      {selectedLectureObj ? selectedLectureObj.subject_name : "Database Systems"}{" "}
                      <span className="text-text-stone font-normal">
                        ({selectedLectureObj ? selectedLectureObj.subject_code : "CS501"})
                      </span>
                    </h2>
                    <p className="font-body-md text-body-md text-text-stone mt-0.5">
                      Cohort CSE-A • Physical Lecture • Room 204 • Scheduled{" "}
                      {selectedLectureObj ? `${selectedLectureObj.start_time} – ${selectedLectureObj.end_time}` : "10:00 – 11:30 AM"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-surface-container px-4 py-2.5 border border-border-default sm:border-0 sm:bg-transparent">
                    <div className="font-label-sm text-label-sm uppercase text-text-stone tracking-wider font-semibold">
                      Dynamic QR TTL
                    </div>
                    <div className="font-headline-md text-headline-md font-mono text-secondary tracking-tight font-bold">
                      {formatTimeOnly(remaining)}
                    </div>
                    <div className="font-label-sm text-label-sm text-text-stone">Auto-refreshes periodically</div>
                  </div>
                </div>

                {/* QR Generation & Session Details Container */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 items-center">
                  {/* Left Column: QR Image & Token Box */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white border border-border-default rounded text-center shadow-xs">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setShowFullscreenQr(true)}
                      title="Click to open full-screen classroom projection"
                    >
                      <img
                        src={qr?.qr_code || getQrGraphic("LECTURE-892041")}
                        alt="Dynamic Attendance QR Code"
                        className="w-48 h-48 object-contain transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                        <span className="bg-primary text-white text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1 shadow">
                          <span className="material-symbols-outlined text-sm">open_in_full</span> Enlarge
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary bg-surface-container px-2.5 py-1 rounded border border-border-default">
                        Token: {qr?.session_token || "LECTURE-892041"}
                      </span>
                      <button
                        onClick={copyToken}
                        className="text-xs bg-secondary text-on-secondary px-2.5 py-1 rounded font-semibold hover:opacity-90 transition-colors cursor-pointer"
                        type="button"
                        title="Copy session code to clipboard"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Attendance Ratios & Controls */}
                  <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-center gap-4 bg-surface-container/60 p-4 border border-border-default rounded">
                      <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-surface-container-high"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                          />
                          <path
                            className="text-secondary"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray="87.5, 100"
                            strokeLinecap="butt"
                            strokeWidth="3.5"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-label-md text-xs font-bold text-on-surface">87.5%</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-headline-md text-xl text-on-surface font-bold">
                          42 <span className="text-text-stone text-sm font-normal">/ 48 Verified</span>
                        </div>
                        <div className="font-label-sm text-xs text-text-stone">2 Marked Late • 4 Pending</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-text-stone flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-success">bluetooth_searching</span>
                          BLE Beacon Signal
                        </span>
                        <span className="font-semibold text-on-surface">-64 dBm (Stable)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-stone flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-success">pin_drop</span>
                          Geofence Guard
                        </span>
                        <span className="font-semibold text-success">98.2% Match (100m)</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => setShowFullscreenQr(true)}
                        className="flex-1 py-2.5 px-3 bg-primary text-on-primary hover:bg-on-surface-variant font-label-md text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer rounded"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                        <span>Open Live Room Projection</span>
                      </button>
                      <button
                        onClick={() => handleGenerateQR(selectedLectureId)}
                        className="py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-primary border border-border-default text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer rounded"
                        type="button"
                        title="Regenerate dynamic QR code"
                      >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-default flex flex-wrap items-center justify-between text-text-stone font-label-sm text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-success font-medium">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                      Dynamic Token Active
                    </span>
                    <span>•</span>
                    <span>Protocol: BLE 5.2 + Hardware Anti-Proxy Guard</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="text-secondary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 font-medium"
                  >
                    <span>View Attendance Register</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 bg-surface-container p-6 border border-border-default flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-stone font-semibold">
                      Upcoming Today
                    </span>
                    <span className="px-2 py-0.5 bg-surface-warm font-label-sm text-label-sm border border-border-default text-text-stone">
                      In 3h 25m
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                    Operating Systems Lab
                  </h3>
                  <p className="font-body-md text-body-md text-text-stone mt-1">CS503 • Section CSE-B</p>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 bg-surface-warm p-3 border border-border-default">
                      <span className="material-symbols-outlined text-secondary text-[20px]">schedule</span>
                      <div>
                        <div className="font-label-sm text-label-sm text-text-stone">Scheduled Timing</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold">02:00 PM – 04:30 PM</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-surface-warm p-3 border border-border-default">
                      <span className="material-symbols-outlined text-secondary text-[20px]">meeting_room</span>
                      <div>
                        <div className="font-label-sm text-label-sm text-text-stone">Location & Infrastructure</div>
                        <div className="font-label-md text-label-md text-on-surface font-semibold">Lab 3 (Linux Workstations)</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-border-default flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-text-stone">Verification: QR + Facial Cam</span>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="text-secondary hover:text-on-secondary-container font-label-md text-label-md font-semibold flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span>Pre-load Roster</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ASSIGNED COURSES & CURRICULA ================= */}
        {activeTab === "courses" && (
          <div className="flex flex-col w-full">
            {/* Editorial Page Title & Curricular Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-default">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-surface-container font-label-sm text-label-sm text-text-stone uppercase tracking-wider">
                    Faculty Portal • Academic Year 2026
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">Autumn Term Active</span>
                </div>
                <h1 className="font-greeting-serif text-greeting-serif text-on-surface tracking-tight leading-none font-bold">
                  Assigned Courses & Curricula
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  Curricular modules, enrolled cohorts, attendance thresholds, and syllabus progression for Autumn Semester 2026.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-end">
                <button
                  onClick={() => setShowRosterModal(true)}
                  className="px-4 py-2.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-2 shadow-sm hover:bg-surface-container transition-all cursor-pointer border border-border-default"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-stone">badge</span>
                  <span>Directory Lookup</span>
                </button>
                <button
                  onClick={() => alert("Batch Attendance Audit initiated across 3 modules.")}
                  className="px-5 py-2.5 bg-secondary text-on-secondary font-label-md text-label-md flex items-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Batch Attendance Audit</span>
                </button>
              </div>
            </section>

            {/* Metric Strip: Minimalist Editorial Blocks */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-b border-border-default">
              <div className="bg-surface-container-lowest p-6 shadow-xs border border-border-default flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Active Modules</span>
                  <span className="material-symbols-outlined text-text-stone text-[20px]">auto_stories</span>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-on-surface font-bold">03</div>
                  <div className="font-label-sm text-label-sm text-text-stone mt-1">2 Core Disciplines • 1 Advanced Elective</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 shadow-xs border border-border-default flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Cohort Census</span>
                  <span className="material-symbols-outlined text-text-stone text-[20px]">group</span>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-on-surface font-bold">129</div>
                  <div className="font-label-sm text-label-sm text-text-stone mt-1">100% Biometric Ledger Registration</div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 shadow-xs border border-border-default flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Aggregate Attendance</span>
                  <span className="material-symbols-outlined text-success text-[20px]">trending_up</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="font-headline-lg text-headline-lg text-on-surface font-bold">89.2%</div>
                    <div className="font-label-sm text-label-sm text-success mt-1 font-semibold">+2.4% vs Spring 2026 Final</div>
                  </div>
                  <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="89.2, 100"
                      strokeLinecap="butt"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 shadow-xs border border-border-default flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold">Statutory Deficits</span>
                  <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-error font-bold">
                    07 <span className="text-sm font-label-md font-normal text-text-stone">Students</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-text-stone mt-1">Below mandatory 75% cutoff threshold</div>
                </div>
              </div>
            </section>

            {/* Editorial Section Divider */}
            <div className="flex items-center gap-4 py-6">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-stone font-semibold">
                Curricular Modules In Session
              </span>
              <div className="flex-1 h-px bg-surface-container"></div>
              <span className="font-label-sm text-label-sm text-text-stone">Autumn 2026 Academic Catalog</span>
            </div>

            {/* Course Portfolio Cards Stack */}
            <div className="space-y-8 pb-10">
              {/* Card 1: CS501 */}
              <article className="bg-surface-container-lowest border border-border-default shadow-xs hover:shadow-sm transition-shadow">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface-warm border-b border-border-default">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold tracking-wider">CSE</span>
                      <span className="font-headline-md text-headline-md text-on-surface leading-tight font-bold">501</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm uppercase font-semibold">
                          Core Compulsory
                        </span>
                        <span className="px-2 py-0.5 bg-success/10 text-success font-label-sm text-label-sm font-medium">
                          91.4% Avg Attendance
                        </span>
                        <span className="text-text-stone font-label-sm text-label-sm">• Cohort CSE-A (48 Students)</span>
                      </div>
                      <h2 className="font-greeting-serif text-headline-lg text-on-surface mt-1.5 font-bold">Database Systems</h2>
                      <div className="flex items-center gap-4 text-text-stone font-label-md text-label-md mt-1 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">meeting_room</span> Room 204 (Turing Hall)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span> Mon, Wed, Fri (10:00 – 11:30 AM)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">radar</span> Geofenced 100m • Dynamic QR
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                    <button
                      onClick={() => openRosterModal("CS501", "Database Systems", "CSE-A", 48)}
                      className="px-3.5 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px]">groups</span>
                      <span>Manage Roster</span>
                    </button>
                    <button
                      onClick={() => alert("Syllabus Progress: Unit 4 of 6 (Relational Algebra, SQL Optimization, B-Tree Indices completed). Next lecture: Concurrency Protocols.")}
                      className="px-3.5 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px]">menu_book</span>
                      <span>View Syllabus</span>
                    </button>
                    <button
                      onClick={() => handleGenerateQR(lectures[0]?.id)}
                      className="px-4 py-2 bg-secondary text-on-secondary hover:opacity-95 font-label-md text-label-md transition-all flex items-center gap-2 cursor-pointer font-semibold"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_circle</span>
                      <span>Start Attendance</span>
                    </button>
                  </div>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-lowest">
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Syllabus Completion</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">32 / 45 Lectures (71%)</span>
                    </div>
                    <div className="w-full bg-surface-container h-2">
                      <div className="bg-secondary h-2" style={{ width: "71%" }}></div>
                    </div>
                    <p className="font-label-sm text-label-sm text-text-stone pt-1">Target mid-semester review threshold completed successfully.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Roster Integrity Status</span>
                      <span className="font-label-md text-label-md text-success font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">verified</span> 0 Flagged Deficits
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2">
                      <div className="bg-success h-2" style={{ width: "100%" }}></div>
                    </div>
                    <p className="font-label-sm text-label-sm text-text-stone pt-1">All 48 enrolled candidates exceed 80% baseline attendance.</p>
                  </div>
                  <div className="bg-surface-container-low p-4 flex items-center justify-between border border-border-default">
                    <div>
                      <div className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Next Lecture Module</div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">Transaction Serializability & 2PL</div>
                      <div className="font-label-sm text-label-sm text-secondary">Tomorrow, 10:00 AM • Room 204</div>
                    </div>
                    <span className="material-symbols-outlined text-text-stone text-[24px]">calendar_today</span>
                  </div>
                </div>
              </article>

              {/* Card 2: CS503 */}
              <article className="bg-surface-container-lowest border border-border-default shadow-xs hover:shadow-sm transition-shadow">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface-warm border-b border-border-default">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold tracking-wider">CSE</span>
                      <span className="font-headline-md text-headline-md text-on-surface leading-tight font-bold">503</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm uppercase font-semibold">
                          Core Compulsory
                        </span>
                        <span className="px-2 py-0.5 bg-warning/10 text-warning font-label-sm text-label-sm font-medium">
                          84.1% Compliant
                        </span>
                        <span className="px-2 py-0.5 bg-error/10 text-error font-label-sm text-label-sm font-medium">
                          4 At-Risk (&lt;75%)
                        </span>
                        <span className="text-text-stone font-label-sm text-label-sm">• Cohort CSE-B (45 Students)</span>
                      </div>
                      <h2 className="font-greeting-serif text-headline-lg text-on-surface mt-1.5 font-bold">Operating Systems & Kernel Architecture</h2>
                      <div className="flex items-center gap-4 text-text-stone font-label-md text-label-md mt-1 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">meeting_room</span> Room 201 / Lab 3
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span> Tue, Thu (01:00 – 02:30 PM)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">wifi_tethering</span> Dual Beacon + Face Biometrics
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                    <button
                      onClick={() => openRosterModal("CS503", "Operating Systems & Kernel Architecture", "CSE-B", 45)}
                      className="px-3.5 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px]">groups</span>
                      <span>Manage Roster</span>
                    </button>
                    <button
                      onClick={() => alert("Syllabus Progress: Unit 3 of 5 (Virtual Memory Paging, Translation Lookaside Buffers, Page Replacement Algorithms in progress).")}
                      className="px-3.5 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px]">menu_book</span>
                      <span>View Syllabus</span>
                    </button>
                    <button
                      onClick={() => handleGenerateQR(lectures[1]?.id || lectures[0]?.id)}
                      className="px-4 py-2 bg-secondary text-on-secondary hover:opacity-95 font-label-md text-label-md transition-all flex items-center gap-2 cursor-pointer font-semibold"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_circle</span>
                      <span>Start Attendance</span>
                    </button>
                  </div>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-lowest">
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Syllabus Completion</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">24 / 40 Lectures (60%)</span>
                    </div>
                    <div className="w-full bg-surface-container h-2">
                      <div className="bg-secondary h-2" style={{ width: "60%" }}></div>
                    </div>
                    <p className="font-label-sm text-label-sm text-text-stone pt-1">Kernel lab projects 1 & 2 submitted and graded.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Roster Integrity Status</span>
                      <span className="font-label-md text-label-md text-error font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">priority_high</span> 4 Critical Flags
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2">
                      <div className="bg-error h-2" style={{ width: "35%" }}></div>
                    </div>
                    <p className="font-label-sm text-label-sm text-error pt-1">Deans warning letters dispatched to Roll #22, #31, #39, #44.</p>
                  </div>
                  <div className="bg-surface-container-low p-4 flex items-center justify-between border border-border-default">
                    <div>
                      <div className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Next Lecture Module</div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">Demand Paging & Page Fault Handlers</div>
                      <div className="font-label-sm text-label-sm text-secondary">Today, 01:00 PM • Room 201</div>
                    </div>
                    <span className="material-symbols-outlined text-text-stone text-[24px]">schedule</span>
                  </div>
                </div>
              </article>

              {/* Card 3: CS508 */}
              <article className="bg-surface-container-lowest border border-border-default shadow-xs hover:shadow-sm transition-shadow">
                <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface-warm border-b border-border-default">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm text-secondary font-semibold tracking-wider">CSE</span>
                      <span className="font-headline-md text-headline-md text-on-surface leading-tight font-bold">508</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm uppercase font-semibold">
                          Senior Elective
                        </span>
                        <span className="px-2 py-0.5 bg-success/10 text-success font-label-sm text-label-sm font-medium">
                          93.8% Exemplary
                        </span>
                        <span className="px-2 py-0.5 bg-error/10 text-error font-label-sm text-label-sm font-medium">
                          3 At-Risk (&lt;75%)
                        </span>
                        <span className="text-text-stone font-label-sm text-label-sm">• Cohort Senior Elective (36 Students)</span>
                      </div>
                      <h2 className="font-greeting-serif text-headline-lg text-on-surface mt-1.5 font-bold">Advanced Distributed Algorithms</h2>
                      <div className="flex items-center gap-4 text-text-stone font-label-md text-label-md mt-1 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">meeting_room</span> Hall B (Amphitheater)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span> Mon, Thu (03:00 – 04:30 PM)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">fingerprint</span> High-Security Dynamic QR Ledger
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start lg:self-center flex-wrap">
                    <button
                      onClick={() => openRosterModal("CS508", "Advanced Distributed Algorithms", "CSE-Elective", 36)}
                      className="px-3.5 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px]">groups</span>
                      <span>Manage Roster</span>
                    </button>
                    <button
                      onClick={() => alert("Syllabus Progress: Unit 3 of 5 (Raft Consensus, Byzantine Fault Tolerance, Vector Clocks). 16 remaining lectures.")}
                      className="px-3.5 py-2 bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px]">menu_book</span>
                      <span>View Syllabus</span>
                    </button>
                    <button
                      onClick={() => handleGenerateQR(lectures[2]?.id || lectures[0]?.id)}
                      className="px-4 py-2 bg-secondary text-on-secondary hover:opacity-95 font-label-md text-label-md transition-all flex items-center gap-2 cursor-pointer font-semibold"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_circle</span>
                      <span>Start Attendance</span>
                    </button>
                  </div>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-lowest">
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Syllabus Completion</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">20 / 36 Lectures (55.5%)</span>
                    </div>
                    <div className="w-full bg-surface-container h-2">
                      <div className="bg-secondary h-2" style={{ width: "55.5%" }}></div>
                    </div>
                    <p className="font-label-sm text-label-sm text-text-stone pt-1">On schedule with research paper seminar presentations.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Roster Integrity Status</span>
                      <span className="font-label-md text-label-md text-warning font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">info</span> 3 Medical Deferrals
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2">
                      <div className="bg-warning h-2" style={{ width: "82%" }}></div>
                    </div>
                    <p className="font-label-sm text-label-sm text-text-stone pt-1">Medical leave certificates verified by Department Head.</p>
                  </div>
                  <div className="bg-surface-container-low p-4 flex items-center justify-between border border-border-default">
                    <div>
                      <div className="font-label-sm text-label-sm text-text-stone uppercase font-semibold">Next Lecture Module</div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">Paxos State Machine Replication</div>
                      <div className="font-label-sm text-label-sm text-secondary">Thursday, 03:00 PM • Hall B</div>
                    </div>
                    <span className="material-symbols-outlined text-text-stone text-[24px]">calendar_month</span>
                  </div>
                </div>
              </article>
            </div>

            {/* Quick Class Scheduling Card */}
            <div className="bg-surface-warm border border-border-default rounded p-6 md:p-8 shadow-xs">
              <h3 className="font-serif-display text-2xl text-primary mb-4 pb-3 border-b border-border-default">
                Schedule New Lecture Session
              </h3>
              <form onSubmit={handleCreateLecture} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Subject ID
                  </label>
                  <input
                    type="number"
                    required
                    value={lectureForm.subject_id}
                    onChange={(e) => setLectureForm({ ...lectureForm, subject_id: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full p-2.5 bg-white border border-border-default rounded text-primary focus:border-secondary outline-none text-sm"
                  />
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
                    className="w-full p-2.5 bg-white border border-border-default rounded text-primary focus:border-secondary outline-none text-sm"
                  />
                </div>
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
                    className="w-full p-2.5 bg-white border border-border-default rounded text-primary focus:border-secondary outline-none text-sm"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full bg-secondary text-on-secondary font-label-md py-2.5 px-4 rounded hover:opacity-90 transition-colors font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {createLoading ? "Scheduling..." : "+ Create Class"}
                  </button>
                </div>
              </form>
              {createMessage && (
                <div
                  className={`mt-4 p-3 rounded text-sm ${
                    createMessage.includes("success")
                      ? "bg-success/10 text-success border border-success/30"
                      : "bg-error-container/20 text-error border border-error/30"
                  }`}
                >
                  {createMessage}
                </div>
              )}
            </div>

            {/* Pedagogical Policy & Threshold Rules Settings */}
            <section className="bg-surface-container-lowest border border-border-default p-8 shadow-xs space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">policy</span>
                    <h3 className="font-greeting-serif text-headline-md text-on-surface font-bold">
                      Attendance Policy & Faculty Verification Protocols
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Statutory university thresholds, grace periods, and physical verification radius enforced during attendance logging.
                  </p>
                </div>
                <button
                  onClick={() => alert("Faculty policy changes saved and synchronized across all active course modules.")}
                  className="px-4 py-2 bg-on-surface text-surface-container-lowest hover:bg-secondary font-label-md text-label-md transition-colors self-start md:self-auto cursor-pointer font-semibold"
                  type="button"
                >
                  Save Policy Configuration
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Board Thresholds */}
                <div className="bg-surface-warm border border-border-default p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-stone text-[20px]">gavel</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wide">
                      Board Thresholds
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="font-label-sm text-label-sm text-text-stone block font-semibold">
                        Mandatory Exam Clearance
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min="60"
                          max="90"
                          value={policyExamThreshold}
                          onChange={(e) => setPolicyExamThreshold(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md border border-border-default focus:outline-none focus:bg-surface-container"
                        />
                        <span className="font-body-md text-body-md text-on-surface">% minimal attendance</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-text-stone block mt-1">
                        Below this requires Syndicate Academic Exemption.
                      </span>
                    </div>
                    <div className="pt-2">
                      <label className="font-label-sm text-label-sm text-text-stone block font-semibold">
                        Automatic Dean Escalation
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min="50"
                          max="75"
                          value={policyDeanThreshold}
                          onChange={(e) => setPolicyDeanThreshold(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md border border-border-default focus:outline-none focus:bg-surface-container"
                        />
                        <span className="font-body-md text-body-md text-on-surface">% warning threshold</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-text-stone block mt-1">
                        Triggers registered SMS and email alerts to guardians.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grace Period Allowance */}
                <div className="bg-surface-warm border border-border-default p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-stone text-[20px]">timelapse</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wide">
                      Grace Period Allowance
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="font-label-sm text-label-sm text-text-stone block font-semibold">
                        Post-Commencement Entry Buffer
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={policyGraceMinutes}
                          onChange={(e) => setPolicyGraceMinutes(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container-lowest text-on-surface font-label-md text-label-md border border-border-default focus:outline-none focus:bg-surface-container cursor-pointer"
                        >
                          <option value="5">5 Minutes (Strict)</option>
                          <option value="10">10 Minutes (Standard Academic Norm)</option>
                          <option value="15">15 Minutes (Lab & Seminar)</option>
                        </select>
                      </div>
                      <span className="font-label-sm text-label-sm text-text-stone block mt-1">
                        Late arrivals logged with timestamped yellow badges.
                      </span>
                    </div>
                    <div className="pt-2">
                      <label className="font-label-sm text-label-sm text-text-stone block font-semibold">
                        Consecutive Absence Trigger
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={policyConsecutiveAbsence}
                          onChange={(e) => setPolicyConsecutiveAbsence(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 bg-surface-container-lowest text-on-surface font-label-md text-label-md border border-border-default focus:outline-none focus:bg-surface-container"
                        />
                        <span className="font-body-md text-body-md text-on-surface">consecutive lectures</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-text-stone block mt-1">
                        Generates academic advisor intervention request.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Protocol Selector */}
                <div className="bg-surface-warm border border-border-default p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-stone text-[20px]">shield</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wide">
                      Verification Modality
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policyCheckQr}
                        onChange={(e) => setPolicyCheckQr(e.target.checked)}
                        className="mt-1 accent-secondary"
                      />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface font-medium">
                          Dynamic QR Code (Refreshes 15s)
                        </div>
                        <div className="font-label-sm text-label-sm text-text-stone">Prevents proxy screen captures and forwarding.</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={policyCheckBleGps}
                        onChange={(e) => setPolicyCheckBleGps(e.target.checked)}
                        className="mt-1 accent-secondary"
                      />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface font-medium">
                          BLE & GPS Geofencing (100m Radius)
                        </div>
                        <div className="font-label-sm text-label-sm text-text-stone">Ensures physical presence inside lecture theater.</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={policyCheckFacial}
                        onChange={(e) => setPolicyCheckFacial(e.target.checked)}
                        className="mt-1 accent-secondary"
                      />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface font-medium">
                          On-Device Facial Biometrics
                        </div>
                        <div className="font-label-sm text-label-sm text-text-stone">Required for high-stakes test sessions and final exams.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Roster Search Modal */}
            {showRosterModal && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-surface-container-lowest max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border-default">
                  <div className="p-6 bg-surface-warm border-b border-border-default flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                        Cohort Directory
                      </span>
                      <h3 className="font-greeting-serif text-headline-md text-on-surface font-bold">
                        {rosterModalTitle}
                      </h3>
                      <p className="font-label-sm text-label-sm text-text-stone">
                        {rosterModalSubtitle}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRosterModal(false)}
                      className="p-2 hover:bg-surface-container text-text-stone hover:text-on-surface cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                  </div>

                  <div className="p-4 bg-surface-container-low border-b border-border-default flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-border-default flex-1 w-full">
                      <span className="material-symbols-outlined text-text-stone text-[18px]">search</span>
                      <input
                        value={rosterSearchText}
                        onChange={(e) => setRosterSearchText(e.target.value)}
                        className="w-full bg-transparent font-label-md text-label-md text-on-surface placeholder:text-text-stone focus:outline-none"
                        placeholder="Filter by Name, Roll No (e.g. 2026-CSE-01)..."
                        type="text"
                      />
                    </div>
                    <select
                      value={rosterCourseFilter}
                      onChange={(e) => setRosterCourseFilter(e.target.value)}
                      className="px-3 py-2 bg-surface-container-lowest border border-border-default text-on-surface font-label-md text-label-md focus:outline-none w-full sm:w-auto cursor-pointer"
                    >
                      <option value="ALL">All Active Courses</option>
                      <option value="CS501">CS501 — Database Systems</option>
                      <option value="CS503">CS503 — Operating Systems</option>
                      <option value="CS508">CS508 — Distributed Algorithms</option>
                    </select>
                  </div>

                  <div className="overflow-y-auto p-6 max-h-[500px]">
                    <table className="w-full text-left font-body-md text-body-md border-collapse">
                      <thead>
                        <tr className="text-text-stone font-label-sm text-label-sm uppercase tracking-wider bg-surface-warm border-b border-border-default">
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Course</th>
                          <th className="py-3 px-4">Lectures Attended</th>
                          <th className="py-3 px-4">Attendance %</th>
                          <th className="py-3 px-4">Statutory Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-label-md text-label-md divide-y divide-border-default">
                        {filteredCandidates.map((cand) => (
                          <tr key={cand.roll} className="hover:bg-surface-warm transition-colors">
                            <td className="py-3.5 px-4 font-mono text-sm text-text-stone">{cand.roll}</td>
                            <td className="py-3.5 px-4 font-medium text-on-surface">{cand.name}</td>
                            <td className="py-3.5 px-4 text-text-stone">{cand.course} ({cand.cohort})</td>
                            <td className="py-3.5 px-4 text-on-surface">{cand.attended}</td>
                            <td
                              className={`py-3.5 px-4 font-semibold ${
                                cand.statusType === "error"
                                  ? "text-error"
                                  : cand.statusType === "warning"
                                  ? "text-warning"
                                  : cand.statusType === "success"
                                  ? "text-success"
                                  : "text-on-surface"
                              }`}
                            >
                              {cand.pct}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium ${
                                  cand.statusType === "error"
                                    ? "bg-error/10 text-error"
                                    : cand.statusType === "warning"
                                    ? "bg-warning/10 text-warning"
                                    : cand.statusType === "success"
                                    ? "bg-success/10 text-success"
                                    : "bg-surface-container text-text-stone"
                                }`}
                              >
                                {cand.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() =>
                                  alert(
                                    `Student Log: ${cand.name} (${cand.roll})\nCourse: ${cand.course}\nAttendance: ${cand.pct} (${cand.attended})\nVerification Status: Verified Biometric Ledger.`
                                  )
                                }
                                className="text-secondary hover:underline text-xs cursor-pointer font-semibold"
                                type="button"
                              >
                                View Log
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-surface-warm border-t border-border-default flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-text-stone">
                      Showing live cohort records from Autumn 2026 registrar database
                    </span>
                    <button
                      onClick={() => setShowRosterModal(false)}
                      className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md cursor-pointer"
                      type="button"
                    >
                      Close Directory
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: SCHEDULE ================= */}
        {activeTab === "schedule" && (
          <div className="flex flex-col w-full">
            {/* Main Header Editorial Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border-default">
              <div className="flex flex-col max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    Semester I • AY 2026-27
                  </span>
                  <span className="text-text-stone text-xs">•</span>
                  <span className="font-label-sm text-label-sm text-text-stone uppercase tracking-wide">
                    Dept. of Computer Science & Engineering
                  </span>
                </div>
                <h1 className="font-greeting-serif text-display-lg text-on-surface leading-tight tracking-tight font-bold">
                  Faculty Timetable & Schedule
                </h1>
                <p className="font-body-md text-body-md text-text-stone mt-2">
                  Weekly teaching commitments, office hours, laboratory sessions, and examination proctoring.
                </p>
              </div>

              {/* Actions & Quick Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex bg-surface-container p-1 border border-border-default">
                  <button
                    onClick={() => setScheduleView("grid")}
                    className={`px-4 py-1.5 font-label-md text-label-md transition-colors cursor-pointer ${
                      scheduleView === "grid"
                        ? "bg-surface-warm text-on-surface shadow-sm font-semibold"
                        : "text-text-stone hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Weekly Grid
                  </button>
                  <button
                    onClick={() => setScheduleView("agenda")}
                    className={`px-4 py-1.5 font-label-md text-label-md transition-colors cursor-pointer ${
                      scheduleView === "agenda"
                        ? "bg-surface-warm text-on-surface shadow-sm font-semibold"
                        : "text-text-stone hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Daily Agenda
                  </button>
                  <button
                    onClick={() => setScheduleView("office-hours")}
                    className={`px-4 py-1.5 font-label-md text-label-md transition-colors cursor-pointer ${
                      scheduleView === "office-hours"
                        ? "bg-surface-warm text-on-surface shadow-sm font-semibold"
                        : "text-text-stone hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Office Hours & Proctoring
                  </button>
                </div>
                <button
                  onClick={() => alert("Reschedule / Extra Class booking window opened.")}
                  className="bg-surface-warm border border-border-default text-on-surface font-label-md text-label-md px-4 py-2.5 hover:bg-surface-container-high transition-colors flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  <span>Reschedule / Extra Class</span>
                </button>
                <button
                  onClick={() => alert("Broadcast notice sent to enrolled students in CS501 & CS503.")}
                  className="bg-secondary text-on-secondary font-label-md text-label-md px-4 py-2.5 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer font-medium"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">broadcast_on_home</span>
                  <span>Broadcast Notice</span>
                </button>
              </div>
            </div>

            {/* Week Navigation Ribbon */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 bg-surface-warm border border-border-default my-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <button
                    onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
                    aria-label="Previous Week"
                    className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setSelectedDayIndex(3)}
                    className="px-3 py-1 font-label-md text-label-md font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    type="button"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedDayIndex((prev) => Math.min(scheduleDays.length - 1, prev + 1))}
                    aria-label="Next Week"
                    className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
                <div className="h-4 w-px bg-border-default hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">calendar_month</span>
                  <span className="font-headline-md text-label-md text-on-surface tracking-tight font-semibold">
                    Week of August 26 – September 01, 2026
                  </span>
                  <span className="px-2 py-0.5 font-label-sm text-label-sm bg-surface-container text-text-stone font-medium">
                    Academic Week 04
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-success inline-block"></span>
                  <span className="font-label-sm text-label-sm text-text-stone">Active Broadcasts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-secondary inline-block"></span>
                  <span className="font-label-sm text-label-sm text-text-stone">In Progress Session</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-border-default inline-block"></span>
                  <span className="font-label-sm text-label-sm text-text-stone">Scheduled Lectures</span>
                </div>
              </div>
            </div>

            {/* Weekly Day Strip Selector */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {scheduleDays.slice(0, 6).map((day, idx) => {
                const isToday = idx === 3;
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={day.name}
                    onClick={() => setSelectedDayIndex(idx)}
                    type="button"
                    className={`group flex flex-col p-4 text-left transition-all cursor-pointer ${
                      isToday
                        ? "bg-secondary text-on-secondary border border-secondary shadow-md relative overflow-hidden"
                        : isSelected
                        ? "bg-surface-container border-2 border-secondary"
                        : "bg-surface-warm border border-border-default hover:border-text-stone"
                    }`}
                  >
                    {isToday && (
                      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>
                    )}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-label-sm text-label-sm font-semibold uppercase ${
                            isToday ? "text-secondary-fixed font-bold tracking-wider" : "text-text-stone"
                          }`}
                        >
                          {day.name}
                        </span>
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>}
                      </div>
                      <span
                        className={`font-headline-md ${
                          isToday ? "text-headline-md text-on-secondary font-bold" : "text-label-md text-text-stone"
                        }`}
                      >
                        {day.date}
                      </span>
                    </div>
                    <div
                      className={`mt-4 pt-3 border-t flex flex-col gap-0.5 ${
                        isToday ? "border-white/20" : "border-border-default"
                      }`}
                    >
                      <span
                        className={`font-label-md text-label-md font-semibold ${
                          isToday ? "text-on-secondary" : "text-on-surface"
                        }`}
                      >
                        {day.count}
                      </span>
                      <span className={`font-label-sm text-label-sm ${isToday ? "text-secondary-fixed" : "text-text-stone"}`}>
                        09:00 – 16:00
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Split Canvas: Daily Timeline (8 Cols) vs Workload & Diagnostics (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Chronological Schedule for Selected Day (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="flex items-center justify-between pb-3 border-b border-border-default">
                  <div>
                    <h2 className="font-greeting-serif text-headline-md text-on-surface font-bold">
                      {currentScheduleDay.dayName} Schedule • August {currentScheduleDay.date}
                    </h2>
                    <span className="font-label-sm text-label-sm text-text-stone">
                      4 sessions planned • Current Time: 10:42 AM IST
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert("Schedule exported to PDF.")}
                      className="px-2.5 py-1 text-on-surface-variant hover:text-on-surface border border-border-default bg-surface-warm text-label-sm font-label-sm flex items-center gap-1.5 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      <span>Export Day</span>
                    </button>
                  </div>
                </div>

                {/* Schedule Timeline Feed */}
                <div className="flex flex-col gap-4">
                  {/* 1. Past Session */}
                  <div className="p-5 bg-surface-warm border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-80">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-surface-container flex flex-col items-center justify-center border border-border-default shrink-0">
                        <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
                        <span className="font-label-sm text-[10px] text-text-stone uppercase mt-0.5">Done</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-text-stone font-semibold tracking-wider">
                            09:00 AM – 10:00 AM
                          </span>
                          <span className="px-2 py-0.5 bg-surface-container text-text-stone font-label-sm text-label-sm">
                            Faculty Governance
                          </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mt-1 font-bold">
                          Department Academic Review Committee
                        </h3>
                        <p className="font-body-md text-label-md text-text-stone flex items-center gap-2 mt-0.5">
                          <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                          <span>Dean's Boardroom (Block B)</span>
                          <span className="text-border-default">•</span>
                          <span>Chaired by Prof. V. Ramanujan</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert("Reviewing minutes of Department Academic Review Committee meeting.")}
                        className="px-3 py-1.5 border border-border-default bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                        type="button"
                      >
                        Minutes of Meeting
                      </button>
                    </div>
                  </div>

                  {/* 2. ACTIVE LIVE CLASS CARD (CS501) */}
                  <div className="p-6 bg-surface-warm border-2 border-secondary relative overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-default">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary text-on-secondary font-label-sm text-label-sm font-bold tracking-wider uppercase">
                          <span className="w-2 h-2 rounded-full bg-surface-warm animate-ping"></span>
                          LIVE NOW
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                          10:00 AM – 11:30 AM (48 min remaining)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-success text-[18px]">wifi_tethering</span>
                        <span className="font-label-sm text-label-sm text-success font-semibold">
                          BLE Beacon Online • Room 204
                        </span>
                      </div>
                    </div>
                    <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-7 flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-label-sm text-label-sm font-bold text-secondary">CS501</span>
                          <span className="text-text-stone text-xs">•</span>
                          <span className="font-label-sm text-label-sm text-text-stone">Batch CSE-A (3rd Year)</span>
                        </div>
                        <h3 className="font-greeting-serif text-headline-lg text-on-surface font-bold">
                          Database Management Systems
                        </h3>
                        <p className="font-body-md text-body-md text-text-stone mt-1">
                          Lecture 14: Multi-version Concurrency Control & Two-Phase Locking Protocols
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-text-stone font-label-sm text-label-sm">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            Lecture Hall 204 (North Wing)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">cast_for_education</span>
                            Interactive Smartboard #2
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-5 bg-surface-container p-4 border border-border-default flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm font-semibold uppercase text-text-stone">
                            Live Attendance
                          </span>
                          <span className="font-label-sm text-label-sm font-bold text-success">87.5% Check-in</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2.5 overflow-hidden">
                          <div className="bg-success h-full transition-all duration-500" style={{ width: "87.5%" }}></div>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="font-display-lg text-headline-lg font-bold text-on-surface leading-none">42</span>
                            <span className="font-label-md text-label-md text-text-stone">/ 48 present</span>
                          </div>
                          <div className="text-right">
                            <span className="font-label-sm text-label-sm text-error font-medium">6 pending / absent</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-border-default/60">
                          <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
                          <span className="font-label-sm text-label-sm text-text-stone">
                            Geo-fence window closes in <strong className="text-on-surface">12m 18s</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-default flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert("Geofence extended by 5 minutes.")}
                          className="px-3 py-1.5 bg-surface-warm border border-border-default hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">more_time</span>
                          <span>Extend Geofence (+5 min)</span>
                        </button>
                        <button
                          onClick={() => alert("Manual check-in override panel opened.")}
                          className="px-3 py-1.5 bg-surface-warm border border-border-default hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                          <span>Manual Override</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleGenerateQR(lectures[0]?.id)}
                        className="bg-secondary text-on-secondary font-label-md text-label-md px-5 py-2 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 font-medium cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">launch</span>
                        <span>Open Live Session Console</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Upcoming Session: Office Hours */}
                  <div className="p-5 bg-surface-warm border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-surface-container flex flex-col items-center justify-center border border-border-default shrink-0">
                        <span className="material-symbols-outlined text-text-stone text-[22px]">perm_contact_calendar</span>
                        <span className="font-label-sm text-[10px] text-text-stone uppercase mt-0.5">OH</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-text-stone font-semibold tracking-wider">
                            01:00 PM – 02:00 PM
                          </span>
                          <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-medium">
                            Booked Appointments
                          </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mt-1 font-bold">
                          Student Advising & Consultation
                        </h3>
                        <p className="font-body-md text-label-md text-text-stone flex items-center gap-2 mt-0.5">
                          <span className="material-symbols-outlined text-[16px]">door_front</span>
                          <span>Faculty Cabin #412</span>
                          <span className="text-border-default">•</span>
                          <span>3 Students Queue (Capstone thesis topics & grade queries)</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert("Viewing roster for 3 booked advising candidates.")}
                        className="px-3 py-1.5 border border-border-default bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>View Roster (3)</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Upcoming Lab: CS503 */}
                  <div className="p-5 bg-surface-warm border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-surface-container flex flex-col items-center justify-center border border-border-default shrink-0">
                        <span className="material-symbols-outlined text-text-stone text-[22px]">terminal</span>
                        <span className="font-label-sm text-[10px] text-text-stone uppercase mt-0.5">Lab</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-text-stone font-semibold tracking-wider">
                            02:00 PM – 04:00 PM
                          </span>
                          <span className="px-2 py-0.5 bg-surface-container text-text-stone font-label-sm text-label-sm font-medium">
                            2 Hours Hands-on
                          </span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mt-1 font-bold">
                          CS503: Operating Systems Practical Lab
                        </h3>
                        <p className="font-body-md text-label-md text-text-stone flex items-center gap-2 mt-0.5">
                          <span className="material-symbols-outlined text-[16px]">memory</span>
                          <span>Systems Laboratory 03 (Ground Floor)</span>
                          <span className="text-border-default">•</span>
                          <span>Batch CSE-B (45 Enrolled)</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alert("Downloading Lab Sheet #04 PDF...")}
                        className="px-3 py-1.5 border border-border-default bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        <span>Lab Sheet #04</span>
                      </button>
                      <button
                        onClick={() => handleGenerateQR(lectures[1]?.id || lectures[0]?.id)}
                        className="px-3 py-1.5 bg-surface-container-highest hover:bg-surface-dim text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>Pre-Open QR</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Historical Class Log Callout */}
                <div className="p-4 bg-surface-container border border-border-default flex items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[22px]">assignment_turned_in</span>
                    <div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">
                        Attendance Auditing Status
                      </div>
                      <div className="font-label-sm text-label-sm text-text-stone">
                        All previous lectures this week verified & pushed to University Registrar ERP.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="font-label-md text-label-md text-secondary hover:underline shrink-0 font-medium cursor-pointer bg-transparent border-0"
                  >
                    Download Digest →
                  </button>
                </div>
              </div>

              {/* Right Column: Workload Panel, Beacon Diagnostics & Proctoring (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Weekly Workload Summary Panel */}
                <div className="p-5 bg-surface-warm border border-border-default flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border-default">
                    <h3 className="font-greeting-serif text-headline-md text-on-surface font-bold">Weekly Workload</h3>
                    <span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 font-medium">
                      28.5 hrs Total
                    </span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between font-label-md text-label-md">
                        <span className="text-on-surface font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-secondary text-[16px]">menu_book</span>
                          Theory Lectures
                        </span>
                        <span className="font-bold text-on-surface">
                          18.5 hrs <span className="text-text-stone font-normal text-xs">/ 20 target</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 overflow-hidden">
                        <div className="bg-secondary h-full" style={{ width: "92.5%" }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between font-label-md text-label-md">
                        <span className="text-on-surface font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-text-stone text-[16px]">science</span>
                          Laboratory Supervision
                        </span>
                        <span className="font-bold text-on-surface">
                          6.0 hrs <span className="text-text-stone font-normal text-xs">/ 6 target</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 overflow-hidden">
                        <div className="bg-success h-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between font-label-md text-label-md">
                        <span className="text-on-surface font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-text-stone text-[16px]">support_agent</span>
                          Scheduled Office Hours
                        </span>
                        <span className="font-bold text-on-surface">
                          4.0 hrs <span className="text-text-stone font-normal text-xs">/ 4 target</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 overflow-hidden">
                        <div className="bg-on-surface h-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border-default flex items-center justify-between text-text-stone font-label-sm text-label-sm">
                    <span>
                      Student Footfall: <strong>142</strong> this week
                    </span>
                    <span className="text-success font-semibold">Capacity Balanced</span>
                  </div>
                </div>

                {/* Proctoring & Exam Duties Spotlight */}
                <div className="p-5 bg-surface-warm border border-border-default flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                      <h4 className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface">
                        Upcoming Proctoring Duty
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      Assigned
                    </span>
                  </div>
                  <div className="bg-surface-container p-4 border border-border-default flex flex-col gap-1.5 mt-1">
                    <span className="font-headline-md text-label-md text-on-surface font-semibold">
                      Mid-Term Evaluation Exam — Hall C
                    </span>
                    <p className="font-body-md text-label-sm text-text-stone">
                      Invigilation duty for B.Tech CSE Semester IV students. Joint duty with Prof. Aaron Paul.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-text-stone font-label-sm text-label-sm pt-2 border-t border-border-default">
                      <span className="font-medium text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">event</span>
                        Thursday, Sept 12, 2026
                      </span>
                      <span>09:30 AM – 12:30 PM</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Viewing exam invigilation roster & duty roster.")}
                    className="w-full py-2 bg-surface-container-lowest border border-border-default hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors text-center font-medium cursor-pointer"
                    type="button"
                  >
                    View All Examination Schedules →
                  </button>
                </div>

                {/* Classroom IoT & Beacon Readiness Sensor Card */}
                <div className="p-5 bg-surface-warm border border-border-default flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-text-stone text-[18px]">sensors</span>
                      <h4 className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface">
                        Hardware & Room Telemetry
                      </h4>
                    </div>
                    <span className="font-label-sm text-label-sm text-text-stone">Live Polling</span>
                  </div>
                  <div className="flex flex-col gap-2.5 mt-1">
                    <div className="p-3 bg-surface-container-lowest border border-border-default flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">Lecture Hall 204</span>
                          <span className="font-label-sm text-label-sm text-text-stone">BLE Beacon #BCN-204-A</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-sm text-label-sm text-success font-semibold">Operational</span>
                        <span className="block font-label-sm text-[11px] text-text-stone">42 peers bound</span>
                      </div>
                    </div>
                    <div className="p-3 bg-surface-container-lowest border border-border-default flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">Systems Lab 3</span>
                          <span className="font-label-sm text-label-sm text-text-stone">BLE Beacon #BCN-LAB-03</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-sm text-label-sm text-success font-semibold">Operational</span>
                        <span className="block font-label-sm text-[11px] text-text-stone">Standby mode</span>
                      </div>
                    </div>
                    <div className="p-3 bg-surface-container-lowest border border-border-default flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">Faculty Cabin 412</span>
                          <span className="font-label-sm text-label-sm text-text-stone">RFID Pad #RF-412</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-sm text-label-sm text-success font-semibold">Ready</span>
                        <span className="block font-label-sm text-[11px] text-text-stone">Reader idle</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 text-text-stone font-label-sm text-[12px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    <span>Contact Department Lab Technician for telemetry drift.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: REPORTS & ANALYTICS ================= */}
        {activeTab === "reports" && (
          <div className="flex flex-col w-full">
            {/* Top Archival Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-default">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                    Accreditation Cycle AY 2024-25
                  </span>
                  <span className="text-text-stone text-label-sm">•</span>
                  <span className="font-label-sm text-label-sm text-text-stone font-medium">Mid-Term Mandatory Ledger</span>
                </div>
                <h1 className="font-greeting-serif text-display-lg text-on-surface tracking-tight leading-none font-bold">
                  Attendance Analytics & Reports
                </h1>
                <p className="font-body-md text-body-md text-text-stone mt-2 max-w-3xl">
                  Cohort compliance metrics, at-risk student monitoring, statutory dean submissions, and accreditation exports for {greetingName}.
                </p>
              </div>

              {/* Primary Archival Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => alert("Downloading PDF Audit Report...")}
                  className="px-4 py-2 bg-surface-container-lowest border border-border-default hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-stone">description</span>
                  <span>Download PDF Audit</span>
                </button>
                <button
                  onClick={() => alert("Exporting CSV Ledger...")}
                  className="px-4 py-2 bg-surface-container-lowest border border-border-default hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-stone">table_view</span>
                  <span>Export CSV Ledger</span>
                </button>
                <button
                  onClick={() => alert("Formal Notice transmitted to Dean of Academic Affairs.")}
                  className="px-4 py-2 bg-secondary text-on-secondary hover:opacity-95 font-label-md text-label-md transition-all flex items-center gap-2 cursor-pointer font-semibold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>File Notice to Dean</span>
                </button>
              </div>
            </div>

            {/* Macro Performance Ledger Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-b border-border-default divide-y sm:divide-y-0 sm:divide-x divide-border-default bg-surface-warm my-6">
              <div className="p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-stone">
                  <span className="font-label-sm text-label-sm tracking-widest uppercase font-semibold">Aggregate Attendance</span>
                  <span className="material-symbols-outlined text-[20px]">equalizer</span>
                </div>
                <div className="mt-4">
                  <div className="font-greeting-serif text-[42px] leading-tight text-on-surface font-bold">89.4%</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-success">north_east</span>
                    <span className="font-label-sm text-label-sm text-success font-medium">+3.2%</span>
                    <span className="font-label-sm text-label-sm text-text-stone">vs. previous term</span>
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-stone">
                  <span className="font-label-sm text-label-sm tracking-widest uppercase font-semibold">Sessions Logged</span>
                  <span className="material-symbols-outlined text-[20px]">history_edu</span>
                </div>
                <div className="mt-4">
                  <div className="font-greeting-serif text-[42px] leading-tight text-on-surface font-bold">76</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">54 Lectures</span>
                    <span className="text-text-stone text-label-sm">/</span>
                    <span className="font-label-sm text-label-sm text-text-stone">22 Practical Labs</span>
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-stone">
                  <span className="font-label-sm text-label-sm tracking-widest uppercase font-semibold">Punctuality Score</span>
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div className="mt-4">
                  <div className="font-greeting-serif text-[42px] leading-tight text-on-surface font-bold">94.2%</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-label-sm text-label-sm text-text-stone">Within 5m Grace Window</span>
                  </div>
                </div>
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-stone">
                  <span className="font-label-sm text-label-sm tracking-widest uppercase font-semibold">Clearance Status</span>
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
                <div className="mt-4">
                  <div className="font-greeting-serif text-[42px] leading-tight text-on-surface font-bold">
                    122<span className="font-body-md text-headline-md text-text-stone font-normal"> / 129</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 bg-error/10 text-error font-label-sm text-label-sm font-semibold">
                      7 Students Under 75%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Backend Roster Inspection Panel */}
            <div className="bg-surface-warm border border-border-default rounded p-6 shadow-xs mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border-default pb-4">
                <div>
                  <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold uppercase tracking-wider mb-1 inline-block">
                    Live Attendance Check-In Roster
                  </span>
                  <h3 className="font-greeting-serif text-3xl text-primary font-bold">Lecture Attendance Register</h3>
                  <p className="text-text-stone text-sm">Review real-time verified student check-in records for selected lectures.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={selectedLectureId}
                    onChange={(e) => {
                      setSelectedLectureId(e.target.value);
                      handleLoadStatus(e.target.value);
                    }}
                    className="p-2.5 bg-white border border-border-default rounded text-primary text-sm flex-1 sm:flex-none cursor-pointer focus:outline-none"
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
                    className="bg-secondary text-on-secondary px-4 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {statusLoading ? "Loading..." : "Refresh Roster"}
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div className="p-3 bg-error-container/20 text-error border border-error/30 rounded text-sm mb-4">
                  {statusMessage}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-default text-xs uppercase tracking-wider text-text-stone bg-surface-container">
                      <th className="py-3 px-4 font-semibold">Student Name</th>
                      <th className="py-3 px-4 font-semibold">Email Address</th>
                      <th className="py-3 px-4 font-semibold">Check-in Time</th>
                      <th className="py-3 px-4 font-semibold">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default text-sm font-label-md">
                    {statusList.length > 0 ? (
                      statusList.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-primary">{item.full_name}</td>
                          <td className="py-3.5 px-4 text-text-stone font-mono text-xs">{item.email}</td>
                          <td className="py-3.5 px-4 text-text-stone">
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
                              {item.status || "Present"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-text-stone">
                          No check-ins recorded for this lecture session yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Primary Academic Row: Curricular Visualizations & Temporal Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-border-default divide-y lg:divide-y-0 lg:divide-x divide-border-default mb-8">
              {/* Course Breakdown (7 Cols) */}
              <div className="lg:col-span-7 p-6 bg-surface-container-lowest">
                <div className="flex items-center justify-between pb-4 border-b border-border-default">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Curricular Compliance by Subject
                    </h2>
                    <p className="font-label-sm text-label-sm text-text-stone">
                      Direct correlation against 75% statutory accreditation threshold
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-label-sm font-label-sm text-text-stone">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-secondary inline-block"></span>CS501
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-on-surface inline-block"></span>CS503
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-success inline-block"></span>CS702
                    </span>
                  </div>
                </div>
                <div className="space-y-6 pt-6">
                  {/* Subject 1 */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          CS501: Relational Database Systems
                        </span>
                        <span className="px-1.5 py-0.5 bg-surface-container text-text-stone font-label-sm text-label-sm">
                          Sec A & B
                        </span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">
                        91.4% <span className="text-text-stone font-normal text-label-sm">(38 Sessions)</span>
                      </div>
                    </div>
                    <div className="relative w-full h-3 bg-surface-container overflow-hidden">
                      <div className="h-full bg-secondary" style={{ width: "91.4%" }}></div>
                      <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-error z-10" title="75% Cutoff Marker"></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-text-stone mt-1.5">
                      <span>52 Enrolled</span>
                      <span className="text-error font-medium">2 At-Risk</span>
                    </div>
                  </div>
                  {/* Subject 2 */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          CS503: Modern Operating Systems Architecture
                        </span>
                        <span className="px-1.5 py-0.5 bg-surface-container text-text-stone font-label-sm text-label-sm">
                          Sec B
                        </span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">
                        84.1% <span className="text-text-stone font-normal text-label-sm">(38 Sessions)</span>
                      </div>
                    </div>
                    <div className="relative w-full h-3 bg-surface-container overflow-hidden">
                      <div className="h-full bg-on-surface" style={{ width: "84.1%" }}></div>
                      <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-error z-10" title="75% Cutoff Marker"></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-text-stone mt-1.5">
                      <span>45 Enrolled</span>
                      <span className="text-error font-medium">4 At-Risk (Post-Recess Dip)</span>
                    </div>
                  </div>
                  {/* Subject 3 */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          CS702: Distributed Consensus & Cloud Algorithms
                        </span>
                        <span className="px-1.5 py-0.5 bg-surface-container text-text-stone font-label-sm text-label-sm">
                          Elective VI
                        </span>
                      </div>
                      <div className="font-label-md text-label-md text-on-surface font-semibold">
                        93.8% <span className="text-text-stone font-normal text-label-sm">(24 Sessions)</span>
                      </div>
                    </div>
                    <div className="relative w-full h-3 bg-surface-container overflow-hidden">
                      <div className="h-full bg-success" style={{ width: "93.8%" }}></div>
                      <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-error z-10" title="75% Cutoff Marker"></div>
                    </div>
                    <div className="flex justify-between items-center text-label-sm font-label-sm text-text-stone mt-1.5">
                      <span>32 Enrolled</span>
                      <span className="text-success font-medium">1 At-Risk (Medical Excusal Pending)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-border-default flex items-center justify-between text-label-sm font-label-sm text-text-stone">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Red marker delineates university statutory exam disqualification line (75%)
                  </span>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="text-secondary hover:underline font-medium cursor-pointer bg-transparent border-0"
                  >
                    View Detailed Syllabi Log →
                  </button>
                </div>
              </div>

              {/* Day-of-Week Compliance Breakdown (5 Cols) */}
              <div className="lg:col-span-5 p-6 bg-surface-warm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border-default">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Temporal Variance</h2>
                      <p className="font-label-sm text-label-sm text-text-stone">Weekly attendance distribution cycle</p>
                    </div>
                    <span className="px-2 py-1 bg-surface-container text-text-stone font-label-sm text-label-sm">
                      Fall 2024
                    </span>
                  </div>

                  {/* Weekly SVG Bar Chart */}
                  <div className="pt-6">
                    <div className="h-44 w-full flex items-end justify-between gap-3 px-2">
                      <div className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">92%</span>
                        <div className="w-full bg-surface-container h-36 flex items-end">
                          <div className="w-full bg-on-surface transition-all group-hover:bg-secondary" style={{ height: "92%" }}></div>
                        </div>
                        <span className="font-label-sm text-label-sm text-text-stone uppercase">Mon</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">88%</span>
                        <div className="w-full bg-surface-container h-36 flex items-end">
                          <div className="w-full bg-on-surface transition-all group-hover:bg-secondary" style={{ height: "88%" }}></div>
                        </div>
                        <span className="font-label-sm text-label-sm text-text-stone uppercase">Tue</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">89%</span>
                        <div className="w-full bg-surface-container h-36 flex items-end">
                          <div className="w-full bg-on-surface transition-all group-hover:bg-secondary" style={{ height: "89%" }}></div>
                        </div>
                        <span className="font-label-sm text-label-sm text-text-stone uppercase">Wed</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">86%</span>
                        <div className="w-full bg-surface-container h-36 flex items-end">
                          <div className="w-full bg-on-surface transition-all group-hover:bg-secondary" style={{ height: "86%" }}></div>
                        </div>
                        <span className="font-label-sm text-label-sm text-text-stone uppercase">Thu</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="font-label-sm text-label-sm text-error font-semibold">79%</span>
                        <div className="w-full bg-surface-container h-36 flex items-end">
                          <div className="w-full bg-error transition-all group-hover:opacity-80" style={{ height: "79%" }}></div>
                        </div>
                        <span className="font-label-sm text-label-sm text-error uppercase font-medium">Fri</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-3.5 bg-surface-container border-l-2 border-secondary text-label-sm font-label-sm text-on-surface-variant leading-relaxed">
                  <strong className="font-semibold text-on-surface">Pattern Observation:</strong> Friday late-afternoon practicals (CS503 Lab, 3:30 PM - 5:30 PM) account for 68% of unexcused absences this month. Notice proposed to Academic Dean for scheduling adjustments.
                </div>
              </div>
            </div>

            {/* At-Risk & Statutory Warning Ledger */}
            <div className="p-6 bg-surface-container-lowest border border-border-default mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-default">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                    </span>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Statutory Attendance Warning Ledger
                    </h2>
                  </div>
                  <p className="font-label-sm text-label-sm text-text-stone mt-1">
                    Students below the mandatory 75% attendance threshold subject to University Exam Hall-Ticket withholding.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => alert("Batch Warning Emails dispatched to 3 flagged candidates.")}
                    className="px-3.5 py-1.5 bg-surface-warm border border-border-default font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px] text-text-stone">mail</span>
                    <span>Batch Dispatch Warnings (3)</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-default text-text-stone font-label-sm text-label-sm uppercase tracking-wider bg-surface-warm">
                      <th className="py-3 px-4 font-semibold">Student Name & ID</th>
                      <th className="py-3 px-4 font-semibold">Course Code & Section</th>
                      <th className="py-3 px-4 font-semibold text-right">Attendance Ratio</th>
                      <th className="py-3 px-4 font-semibold text-right">Deficit</th>
                      <th className="py-3 px-4 font-semibold">Statutory Advisory Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default font-body-md text-body-md text-on-surface">
                    <tr className="hover:bg-surface-warm/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-on-surface font-semibold">Jay Mehta</div>
                        <div className="font-label-sm text-label-sm text-text-stone font-mono">UID: 2022-CSE-084 • CSE-A</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-label-md text-label-md font-medium text-on-surface">CS501 Database Systems</div>
                        <div className="font-label-sm text-label-sm text-text-stone">Lecture & Lab Sessions</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-greeting-serif text-[20px] font-bold text-error">68.4%</span>
                        <div className="font-label-sm text-label-sm text-text-stone">26 of 38 Attended</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="px-2 py-0.5 bg-error/10 text-error font-label-sm text-label-sm font-semibold">-6.6%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error/10 text-error font-label-sm text-label-sm font-medium">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Level 2 (Parents Notified)
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => alert("Warning Citation Slip generated for Jay Mehta (UID: 2022-CSE-084).")}
                            className="px-2.5 py-1 bg-surface-container-high hover:bg-border-default text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                            title="Generate formal citation slip"
                            type="button"
                          >
                            Slip
                          </button>
                          <button
                            onClick={() => alert("Compensatory duty leave applied for Jay Mehta.")}
                            className="px-2.5 py-1 bg-secondary text-on-secondary hover:opacity-90 font-label-sm text-label-sm transition-all cursor-pointer font-medium"
                            title="Apply compensatory leave"
                            type="button"
                          >
                            Pardon Duty
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-warm/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-on-surface font-semibold">Priya Nair</div>
                        <div className="font-label-sm text-label-sm text-text-stone font-mono">UID: 2022-CSE-112 • CSE-B</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-label-md text-label-md font-medium text-on-surface">CS503 Operating Systems</div>
                        <div className="font-label-sm text-label-sm text-text-stone">Lecture Sessions</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-greeting-serif text-[20px] font-bold text-error">71.1%</span>
                        <div className="font-label-sm text-label-sm text-text-stone">27 of 38 Attended</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="px-2 py-0.5 bg-error/10 text-error font-label-sm text-label-sm font-semibold">-3.9%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 text-warning font-label-sm text-label-sm font-medium">
                          <span className="material-symbols-outlined text-[14px]">flag</span>
                          Level 1 Advisory Issued
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => alert("Warning Slip generated for Priya Nair.")}
                          className="px-2.5 py-1 bg-surface-container-high hover:bg-border-default text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                          type="button"
                        >
                          Generate Warning Slip
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-warm/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-on-surface font-semibold">Vikram Rao</div>
                        <div className="font-label-sm text-label-sm text-text-stone font-mono">UID: 2022-CSE-039 • CSE-A</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-label-md text-label-md font-medium text-on-surface">CS501 Database Systems</div>
                        <div className="font-label-sm text-label-sm text-text-stone">Lecture & Practical Sessions</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-greeting-serif text-[20px] font-bold text-warning">73.6%</span>
                        <div className="font-label-sm text-label-sm text-text-stone">28 of 38 Attended</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="px-2 py-0.5 bg-warning/10 text-warning font-label-sm text-label-sm font-semibold">-1.4%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
                          <span className="material-symbols-outlined text-[14px]">schedule_send</span>
                          First Warning Sent
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => alert("Reviewing absence timeline for Vikram Rao.")}
                          className="px-2.5 py-1 bg-surface-container-high hover:bg-border-default text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                          type="button"
                        >
                          Review Absences
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section: Duty Leave & Statutory Exemption Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-border-default divide-y lg:divide-y-0 lg:divide-x divide-border-default mb-8">
              {/* Exemption Ledger (8 cols) */}
              <div className="lg:col-span-8 p-6 bg-surface-container-lowest">
                <div className="flex items-center justify-between pb-4 border-b border-border-default">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Statutory Dispensations & Medical Duty Leave
                    </h3>
                    <p className="font-label-sm text-label-sm text-text-stone">
                      Formal university sanctions applied to clear attendance debits
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-success/10 text-success font-label-sm text-label-sm font-medium">
                    4 Verified Exemption Batches
                  </span>
                </div>
                <div className="divide-y divide-border-default mt-2">
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-surface-container text-secondary mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">emoji_events</span>
                      </div>
                      <div>
                        <div className="font-label-md text-label-md font-semibold text-on-surface">
                          National Smart India Hackathon Delegation
                        </div>
                        <p className="font-label-sm text-label-sm text-text-stone">
                          4 Students excused from CS501 & CS503 Labs (Oct 14 - Oct 17)
                        </p>
                        <div className="font-label-sm text-label-sm text-text-stone mt-1 font-mono">
                          Endorsement: Dean Academic Affairs • Memo #DAA/24/091
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm">
                        +4 Sessions Added
                      </span>
                      <span className="text-success font-label-sm text-label-sm flex items-center gap-1 mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Ledger Reconciled
                      </span>
                    </div>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-surface-container text-text-stone mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">medical_services</span>
                      </div>
                      <div>
                        <div className="font-label-md text-label-md font-semibold text-on-surface">
                          University Infirmary Hospitalization - R. Sen
                        </div>
                        <p className="font-label-sm text-label-sm text-text-stone">
                          Dengue Recovery Certification (7 Calendar Days • UID: 2022-CSE-019)
                        </p>
                        <div className="font-label-sm text-label-sm text-text-stone mt-1 font-mono">
                          Medical Board Dr. R. Bhatia • Ref #MED-8821
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm">
                        +6 Sessions Credited
                      </span>
                      <span className="text-success font-label-sm text-label-sm flex items-center gap-1 mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Statutory Exemption
                      </span>
                    </div>
                  </div>

                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-surface-container text-text-stone mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">sports_tennis</span>
                      </div>
                      <div>
                        <div className="font-label-md text-label-md font-semibold text-on-surface">
                          Inter-University Athletics Championship
                        </div>
                        <p className="font-label-sm text-label-sm text-text-stone">
                          Track & Field Tournament representation (Nov 02 - Nov 04)
                        </p>
                        <div className="font-label-sm text-label-sm text-text-stone mt-1 font-mono">
                          Sports Board Approval • Memo #PED/2024/44
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0">
                      <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-label-sm">
                        +3 Sessions Credited
                      </span>
                      <span className="text-success font-label-sm text-label-sm flex items-center gap-1 mt-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Roster Updated
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Certification Box (4 cols) */}
              <div className="lg:col-span-4 p-6 bg-surface-warm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-text-stone pb-3 border-b border-border-default">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold">Faculty Affidavit</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface mt-4 leading-relaxed">
                    I hereby certify that the aggregate records logged for the current academic session reflect bona fide lecture tallies and duty concessions governed by Departmental Bylaws.
                  </p>
                  <div className="mt-6 p-4 bg-surface-container-lowest border border-border-default">
                    <div className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider">
                      Accreditation Cryptographic Hash
                    </div>
                    <div className="font-mono text-label-sm text-on-surface break-all mt-1 font-bold">
                      SHA-256: 8f92-ec01-447b-891d-aa93-fceb-3129-d04b
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-label-sm text-text-stone">
                      <span className="material-symbols-outlined text-[14px] text-success">lock</span>
                      <span>Tamper-evident system timestamp: Nov 14, 2024 10:45 AM</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-border-default">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">{greetingName}</div>
                      <div className="font-label-sm text-label-sm text-text-stone">Professor & Chair, CSE Dept</div>
                    </div>
                    <button
                      onClick={() => alert(`Accreditation Ledger signed & transmitted by ${greetingName}.`)}
                      className="px-3.5 py-2 bg-on-surface text-surface hover:opacity-90 font-label-md text-label-md transition-all flex items-center gap-2 cursor-pointer font-semibold"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">draw</span>
                      <span>Sign & Transmit</span>
                    </button>
                  </div>
                </div>
              </div>
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

              <main className="lg:col-span-9 flex flex-col gap-10">
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
                      <div className="w-20 h-20 rounded-full bg-secondary text-on-secondary font-bold text-3xl flex items-center justify-center border-2 border-border-default shrink-0">
                        {user?.full_name ? user.full_name.charAt(0) : "S"}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-serif-display text-2xl text-primary">{user?.full_name || "Dr. Sarah Jenkins"}</h4>
                        <p className="text-sm text-text-stone mt-0.5">Senior Professor • Computer Science & Engineering</p>
                        <p className="text-xs font-mono text-text-muted mt-1">{user?.email || "sarah.jenkins@university.edu"}</p>
                      </div>
                    </div>
                  </section>
                )}

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
                          className="w-5 h-5 accent-secondary cursor-pointer"
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
                          className="w-5 h-5 accent-secondary cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>
                )}

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
                    className="bg-secondary text-on-secondary px-6 py-2 rounded text-sm font-semibold hover:opacity-90 transition-colors cursor-pointer"
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
              className="w-full bg-secondary text-on-secondary py-2.5 rounded text-sm font-semibold cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIVE QR PROJECTION MODAL */}
      {showFullscreenQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#F5F2EA] max-w-2xl w-full p-8 rounded-lg border border-border-default shadow-2xl flex flex-col items-center text-center relative">
            <button
              onClick={() => setShowFullscreenQr(false)}
              className="absolute top-4 right-4 p-2 text-text-stone hover:text-primary rounded-full hover:bg-surface-container transition-colors cursor-pointer"
              title="Close Projection"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-success animate-ping"></span>
              <span className="font-label-sm text-xs uppercase tracking-widest text-secondary font-bold">
                Live Classroom QR Broadcast
              </span>
            </div>

            <h2 className="font-greeting-serif text-3xl md:text-4xl text-primary font-bold mb-1">
              {selectedLectureObj ? selectedLectureObj.subject_name : "Database Systems"}
            </h2>
            <p className="font-body-md text-text-stone text-sm mb-6">
              {selectedLectureObj ? selectedLectureObj.subject_code : "CS501"} • Room 204 • Scan using Student LectureLog App
            </p>

            {/* Massive QR Code */}
            <div className="bg-white p-6 border-4 border-secondary rounded-xl shadow-lg mb-6">
              <img
                src={qr?.qr_code || getQrGraphic(qr?.session_token || "LECTURE-892041")}
                alt="Live Broadcast QR Code"
                className="w-72 h-72 md:w-80 md:h-80 object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-surface-warm p-4 border border-border-default rounded-lg w-full justify-around mb-4">
              <div>
                <span className="block text-xs uppercase font-bold text-text-stone tracking-wider">Manual Code</span>
                <span className="font-mono text-xl font-bold text-primary tracking-widest">
                  {qr?.session_token || "LECTURE-892041"}
                </span>
              </div>
              <div className="h-8 w-px bg-border-default hidden sm:block"></div>
              <div>
                <span className="block text-xs uppercase font-bold text-text-stone tracking-wider">Time Remaining</span>
                <span className="font-mono text-xl font-bold text-secondary">
                  {formatTimeOnly(remaining)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={copyToken}
                className="flex-1 py-2.5 bg-secondary text-on-secondary rounded text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
              >
                {copied ? "Copied Manual Code!" : "Copy Code"}
              </button>
              <button
                onClick={() => setShowFullscreenQr(false)}
                className="flex-1 py-2.5 bg-surface-container border border-border-default text-primary rounded text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Close Room View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}