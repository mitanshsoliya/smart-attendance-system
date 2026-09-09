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

  // Faculty Courses Catalog
  const facultyCourses = [
    {
      code: "CS501",
      name: "Database Systems",
      enrolled: 48,
      schedule: "Mon, Thu • 10:00 AM",
      room: "Room 204, Turing Building",
      avgAttendance: "92.5%",
      status: "Active",
    },
    {
      code: "CS503",
      name: "Operating Systems Lab",
      enrolled: 45,
      schedule: "Tue, Fri • 02:00 PM",
      room: "Lab 3, Babbage Block",
      avgAttendance: "88.0%",
      status: "Active",
    },
    {
      code: "CS508",
      name: "Advanced Algorithms",
      enrolled: 36,
      schedule: "Wed, Sat • 11:30 AM",
      room: "Lecture Hall B",
      avgAttendance: "95.2%",
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
            {/* Top Academic Context Header & Action Bar */}
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

              {/* Action Group */}
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

                  {/* Quick Launch Dropdown */}
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

            {/* Today's Live Academic Operations Grid */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Active Real-time Card (8 cols) */}
              <div className="lg:col-span-8 bg-surface-warm border border-border-default p-6 relative overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                      </span>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                        Active Session in Progress
                      </span>
                      <span className="text-border-default">•</span>
                      <span className="font-label-sm text-label-sm text-text-stone">Today, Thursday 29 Aug 2026</span>
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                      Database Systems <span className="text-text-stone font-normal">(CS501)</span>
                    </h2>
                    <p className="font-body-md text-body-md text-text-stone mt-0.5">
                      Cohort CSE-A • Physical Lecture • Room 204 • Scheduled 10:00 – 11:30 AM
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-surface-container px-4 py-2.5 border border-border-default sm:border-0 sm:bg-transparent">
                    <div className="font-label-sm text-label-sm uppercase text-text-stone tracking-wider font-semibold">
                      Dynamic QR TTL
                    </div>
                    <div className="font-headline-md text-headline-md font-mono text-secondary tracking-tight font-bold">
                      {formatTimeOnly(remaining)}
                    </div>
                    <div className="font-label-sm text-label-sm text-text-stone">Cycle #14 of 20</div>
                  </div>
                </div>

                {/* Live Metrics & Telemetry */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 items-center">
                  {/* Attendance Ring Chart */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
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
                        <span className="font-label-md text-label-md font-bold text-on-surface">87.5%</span>
                        <span className="font-label-sm text-[10px] text-text-stone">Present</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-headline-md text-headline-md text-on-surface leading-tight font-bold">
                        42 <span className="text-text-stone text-body-md font-normal">/ 48</span>
                      </div>
                      <div className="font-label-sm text-label-sm text-text-stone">Verified Present</div>
                      <div className="font-label-sm text-label-sm text-text-stone mt-1">2 Marked Late • 4 Pending</div>
                    </div>
                  </div>

                  {/* Telemetry Indicators */}
                  <div className="border-l border-border-default pl-4 space-y-2">
                    <div className="flex items-center justify-between text-body-md">
                      <span className="font-label-sm text-label-sm text-text-stone flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-success">bluetooth_searching</span>
                        BLE Beacon Strength
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">-64 dBm (Stable)</span>
                    </div>
                    <div className="flex items-center justify-between text-body-md">
                      <span className="font-label-sm text-label-sm text-text-stone flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-success">pin_drop</span>
                        Geofence Accuracy
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold text-success">98.2% Match</span>
                    </div>
                    <div className="flex items-center justify-between text-body-md">
                      <span className="font-label-sm text-label-sm text-text-stone flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-text-stone">security</span>
                        Anti-Proxy Guard
                      </span>
                      <span className="font-label-sm text-label-sm text-text-stone">Active (Hardware Lock)</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => handleGenerateQR(lectures[0]?.id)}
                      className="w-full py-2.5 px-4 bg-primary text-on-primary hover:bg-on-surface-variant font-label-md text-label-md font-medium tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                      <span>Open Live Room Mode</span>
                    </button>
                    <button
                      onClick={() => alert("Session concluded and roll register locked.")}
                      className="w-full py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-error border border-border-default font-label-md text-label-md font-medium tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                      <span>Conclude & Lock Register</span>
                    </button>
                  </div>
                </div>

                {/* Footer Micro Bar */}
                <div className="pt-3 border-t border-border-default flex flex-wrap items-center justify-between text-text-stone font-label-sm text-label-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      Dynamic Salt: 0x9AF...2B
                    </span>
                    <span>•</span>
                    <span>Handshake Protocol: BLE 5.2 L2CAP</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="text-secondary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                  >
                    <span>Student Terminal View</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Lecture Card (4 cols) */}
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

            {/* Filter & Ledger Controls Bar */}
            <div className="mt-10 pt-6 border-t border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                  Academic Attendance Ledger
                </h3>
                <p className="font-body-md text-body-md text-text-stone">
                  Complete session history, geofence audit compliance, and roll registers.
                </p>
              </div>
              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={ledgerCourseFilter}
                    onChange={(e) => setLedgerCourseFilter(e.target.value)}
                    className="appearance-none bg-surface-warm border border-border-default text-on-surface font-label-md text-label-md py-2 pl-3 pr-8 focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option>All Assigned Courses</option>
                    <option>CS501: Database Systems</option>
                    <option>CS503: Operating Systems Lab</option>
                    <option>CS508: Advanced Algorithms</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-text-stone text-[16px]">
                    expand_more
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={ledgerSectionFilter}
                    onChange={(e) => setLedgerSectionFilter(e.target.value)}
                    className="appearance-none bg-surface-warm border border-border-default text-on-surface font-label-md text-label-md py-2 pl-3 pr-8 focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option>All Sections</option>
                    <option>CSE-A</option>
                    <option>CSE-B</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-text-stone text-[16px]">
                    expand_more
                  </span>
                </div>

                <div className="relative">
                  <select className="appearance-none bg-surface-warm border border-border-default text-on-surface font-label-md text-label-md py-2 pl-3 pr-8 focus:outline-none focus:border-secondary cursor-pointer">
                    <option>This Week (25 - 31 Aug)</option>
                    <option>Autumn Semester 2026</option>
                    <option>Last 30 Days</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-text-stone text-[16px]">
                    expand_more
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={ledgerStatusFilter}
                    onChange={(e) => setLedgerStatusFilter(e.target.value)}
                    className="appearance-none bg-surface-warm border border-border-default text-on-surface font-label-md text-label-md py-2 pl-3 pr-8 focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option>All Statuses</option>
                    <option>Completed & Signed</option>
                    <option>Active Now</option>
                    <option>Discrepancy Flagged</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-text-stone text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Ledger Grid & Discrepancy Queue Split (8:4 layout) */}
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Main Ledger Table (XL: 8 cols) */}
              <div className="xl:col-span-8 bg-surface-warm border border-border-default">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-default bg-surface-container text-text-stone font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Course & Cohort</th>
                        <th className="py-3 px-4">Mode / Tech</th>
                        <th className="py-3 px-4">Roll Breakdown</th>
                        <th className="py-3 px-4">Geofence</th>
                        <th className="py-3 px-4">Verification Health</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default font-body-md text-body-md text-on-surface">
                      {/* Row 1: Today Active */}
                      <tr className="hover:bg-surface-container/50 transition-colors bg-surface-container-low/40">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-semibold text-on-surface">29 Aug • 10:00 AM</div>
                          <div className="font-label-sm text-label-sm text-secondary flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
                            In Progress
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">CS501: Database Systems</div>
                          <div className="font-label-sm text-label-sm text-text-stone">CSE-A • Lecture 14</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-label-sm text-label-sm text-on-surface">Room 204</span>
                          <span className="block font-label-sm text-[11px] text-text-stone font-mono">QR + BLE</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">
                            42 <span className="text-text-stone text-label-sm">/ 48</span>
                          </div>
                          <div className="font-label-sm text-label-sm text-text-stone">42 Pres • 2 Late • 4 Abs</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-md text-label-md font-semibold text-success">98.2%</span>
                            <span className="material-symbols-outlined text-[16px] text-success">check_circle</span>
                          </div>
                          <div className="w-16 h-1 bg-surface-container-high rounded-none overflow-hidden mt-0.5">
                            <div className="h-full bg-success" style={{ width: "98.2%" }}></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-success/10 text-success font-label-sm text-label-sm font-semibold tracking-wide border border-success/30">
                            Verified High
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setActiveTab("reports")}
                              className="text-secondary hover:underline font-label-sm text-label-sm font-semibold cursor-pointer"
                              type="button"
                            >
                              Live Log
                            </button>
                            <span className="text-border-default">|</span>
                            <button
                              onClick={() => alert("Quick Edit modal launched.")}
                              className="text-text-stone hover:text-on-surface font-label-sm text-label-sm cursor-pointer"
                              type="button"
                            >
                              Quick Edit
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: Yesterday Lab */}
                      <tr className="hover:bg-surface-container/50 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-semibold text-on-surface">28 Aug • 02:00 PM</div>
                          <div className="font-label-sm text-label-sm text-text-stone">Session Closed</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">CS503: Operating Systems Lab</div>
                          <div className="font-label-sm text-label-sm text-text-stone">CSE-B • Lab Session 06</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-label-sm text-label-sm text-on-surface">Lab 3</span>
                          <span className="block font-label-sm text-[11px] text-text-stone font-mono">QR + Face</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">
                            41 <span className="text-text-stone text-label-sm">/ 45</span>
                          </div>
                          <div className="font-label-sm text-label-sm text-text-stone">41 Pres • 1 Late • 3 Abs</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-md text-label-md font-semibold text-success">95.5%</span>
                            <span className="material-symbols-outlined text-[16px] text-success">check_circle</span>
                          </div>
                          <div className="w-16 h-1 bg-surface-container-high rounded-none overflow-hidden mt-0.5">
                            <div className="h-full bg-success" style={{ width: "95.5%" }}></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-success/10 text-success font-label-sm text-label-sm font-semibold tracking-wide border border-success/30">
                            Verified High
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setActiveTab("reports")}
                              className="text-on-surface hover:text-secondary font-label-sm text-label-sm font-semibold cursor-pointer"
                              type="button"
                            >
                              View Log
                            </button>
                            <span className="text-border-default">|</span>
                            <button
                              onClick={() => alert("Audit PDF generated.")}
                              className="text-text-stone hover:text-on-surface font-label-sm text-label-sm cursor-pointer"
                              type="button"
                            >
                              Audit PDF
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 3: Flagged Discrepancy */}
                      <tr className="hover:bg-surface-container/50 transition-colors bg-warning/5">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-semibold text-on-surface">27 Aug • 10:00 AM</div>
                          <div className="font-label-sm text-label-sm text-warning font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">flag</span>
                            Pending Review
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">CS501: Database Systems</div>
                          <div className="font-label-sm text-label-sm text-text-stone">CSE-A • Lecture 13</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-label-sm text-label-sm text-on-surface">Room 204</span>
                          <span className="block font-label-sm text-[11px] text-text-stone font-mono">QR + BLE</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">
                            40 <span className="text-text-stone text-label-sm">/ 48</span>
                          </div>
                          <div className="font-label-sm text-label-sm text-text-stone">40 Pres • 3 Late • 5 Abs</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-md text-label-md font-semibold text-warning">92.1%</span>
                            <span className="material-symbols-outlined text-[16px] text-warning">warning</span>
                          </div>
                          <div className="w-16 h-1 bg-surface-container-high rounded-none overflow-hidden mt-0.5">
                            <div className="h-full bg-warning" style={{ width: "92.1%" }}></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-warning/15 text-warning font-label-sm text-label-sm font-semibold tracking-wide border border-warning/40">
                            Flagged (2 Appeals)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => alert("Reviewing flagged session...")}
                              className="text-warning hover:underline font-label-sm text-label-sm font-bold cursor-pointer"
                              type="button"
                            >
                              Review Flag
                            </button>
                            <span className="text-border-default">|</span>
                            <button
                              onClick={() => alert("Loading audit log...")}
                              className="text-text-stone hover:text-on-surface font-label-sm text-label-sm cursor-pointer"
                              type="button"
                            >
                              Audit Log
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 4: Advanced Algorithms Elective */}
                      <tr className="hover:bg-surface-container/50 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-semibold text-on-surface">26 Aug • 11:30 AM</div>
                          <div className="font-label-sm text-label-sm text-text-stone">Session Closed</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">CS508: Advanced Algorithms</div>
                          <div className="font-label-sm text-label-sm text-text-stone">Elective Cohort • Sem 5</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-label-sm text-label-sm text-on-surface">Hall B</span>
                          <span className="block font-label-sm text-[11px] text-text-stone font-mono">Biometric Terminal</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-label-md text-label-md font-medium text-on-surface">
                            35 <span className="text-text-stone text-label-sm">/ 36</span>
                          </div>
                          <div className="font-label-sm text-label-sm text-text-stone">35 Pres • 0 Late • 1 Abs</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-md text-label-md font-semibold text-success">100.0%</span>
                            <span className="material-symbols-outlined text-[16px] text-success">verified</span>
                          </div>
                          <div className="w-16 h-1 bg-surface-container-high rounded-none overflow-hidden mt-0.5">
                            <div className="h-full bg-success" style={{ width: "100%" }}></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-success/10 text-success font-label-sm text-label-sm font-semibold tracking-wide border border-success/30">
                            Verified High
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setActiveTab("reports")}
                              className="text-on-surface hover:text-secondary font-label-sm text-label-sm font-semibold cursor-pointer"
                              type="button"
                            >
                              View Log
                            </button>
                            <span className="text-border-default">|</span>
                            <button
                              onClick={() => alert("Editing session attributes...")}
                              className="text-text-stone hover:text-on-surface font-label-sm text-label-sm cursor-pointer"
                              type="button"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                <div className="px-4 py-3 border-t border-border-default bg-surface-warm flex flex-col sm:flex-row items-center justify-between gap-3 text-text-stone font-label-sm text-label-sm">
                  <div>
                    Showing <span className="font-semibold text-on-surface">1 – 4</span> of 38 sessions (Autumn Semester)
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="px-3 py-1 border border-border-default hover:bg-surface-container text-on-surface disabled:opacity-40"
                      disabled
                      type="button"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 bg-surface-container text-on-surface font-semibold border border-border-default">
                      1
                    </span>
                    <button className="px-3 py-1 border border-border-default hover:bg-surface-container text-on-surface" type="button">
                      2
                    </button>
                    <button className="px-3 py-1 border border-border-default hover:bg-surface-container text-on-surface" type="button">
                      3
                    </button>
                    <button className="px-3 py-1 border border-border-default hover:bg-surface-container text-on-surface" type="button">
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Discrepancy & Manual Correction Queue (XL: 4 cols) */}
              <div className="xl:col-span-4 bg-surface-warm border border-border-default flex flex-col">
                <div className="p-5 border-b border-border-default bg-surface-container flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-warning text-[20px]">assignment_late</span>
                      <h4 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                        Manual Queue
                      </h4>
                    </div>
                    <p className="font-label-sm text-label-sm text-text-stone mt-0.5">
                      {appealsList.filter((a) => a.status === "pending").length} pending roll discrepancy requests
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-warning/20 text-warning font-label-sm text-label-sm font-semibold border border-warning/30">
                    {appealsList.filter((a) => a.status === "pending").length} Action Items
                  </span>
                </div>

                {/* Appeals Stack */}
                <div className="divide-y divide-border-default">
                  {appealsList.map((appeal) => {
                    const isResolved = appeal.status !== "pending";
                    return (
                      <div
                        key={appeal.id}
                        className={`p-5 transition-all ${
                          isResolved ? "opacity-40 bg-surface-container/50" : "hover:bg-surface-container-low"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-label-md text-label-md font-semibold text-on-surface">
                              {appeal.name}
                            </div>
                            <div className="font-label-sm text-label-sm text-text-stone font-mono">
                              {appeal.roll}
                            </div>
                          </div>
                          <span
                            className={`font-label-sm text-label-sm px-2 py-0.5 border ${
                              appeal.tagType === "error"
                                ? "bg-error/10 text-error border-error/30"
                                : appeal.tagType === "secondary"
                                ? "bg-secondary/10 text-secondary border-secondary/30"
                                : "bg-warning/15 text-warning border-warning/30"
                            }`}
                          >
                            {appeal.tag}
                          </span>
                        </div>

                        <div className="mt-3 p-2.5 bg-surface-container border border-border-default text-text-stone font-body-md text-label-sm leading-relaxed">
                          <span className="text-on-surface font-medium">“</span>
                          {appeal.quote}
                          <span className="text-on-surface font-medium">”</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-label-sm text-text-stone">
                          <span>{appeal.detail}</span>
                          {appeal.rssi && <span className="font-medium text-success">{appeal.rssi}</span>}
                          {appeal.link && (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert("Opening document preview...");
                              }}
                              className="text-secondary hover:underline font-medium"
                            >
                              {appeal.link}
                            </a>
                          )}
                        </div>

                        {isResolved ? (
                          <div className="mt-3 pt-2 border-t border-border-default font-label-sm text-label-sm text-text-stone text-center uppercase tracking-wider font-semibold">
                            Appeal {appeal.status === "accepted" ? "Accepted & Logged" : "Rejected"}
                          </div>
                        ) : (
                          <div className="mt-4 pt-3 border-t border-border-default flex items-center gap-2">
                            <button
                              onClick={() => resolveAppeal(appeal.id, "accepted")}
                              className="flex-1 py-1.5 px-3 bg-secondary text-on-secondary hover:opacity-90 font-label-sm text-label-sm font-medium tracking-wide flex items-center justify-center gap-1 cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                              <span>Accept Roll</span>
                            </button>
                            <button
                              onClick={() => resolveAppeal(appeal.id, "rejected")}
                              className="py-1.5 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm border border-border-default cursor-pointer"
                              type="button"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => alert(`Fingerprint details for ${appeal.name}: UUID verified, BLE RSSI -58 dBm.`)}
                              className="p-1.5 text-text-stone hover:text-on-surface cursor-pointer"
                              title="Audit device fingerprint"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[18px]">info</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-border-default bg-surface-container text-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Opening resolved appeals archive...");
                    }}
                    className="font-label-sm text-label-sm text-secondary hover:underline font-semibold flex items-center justify-center gap-1"
                  >
                    <span>View Archive of Resolved Appeals (46 this term)</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Academic Integrity & Compliance Audit Footnote */}
            <div className="mt-10 p-6 bg-surface-container border border-border-default flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-warm border border-border-default flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div>
                  <div className="font-label-md text-label-md font-semibold text-on-surface">
                    Institutional Audit Ledger Synchronized
                  </div>
                  <div className="font-label-sm text-label-sm text-text-stone">
                    All session timestamps are SHA-256 hash-anchored to the University Registrar DB. Minimum attendance requirement for CS501 is 75.0%.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => alert("Downloading audit certificate...")}
                  className="px-4 py-2 bg-surface-warm text-on-surface hover:bg-surface-container-high border border-border-default font-label-md text-label-md cursor-pointer"
                  type="button"
                >
                  Download Audit Certificate
                </button>
                <button
                  onClick={() => alert("Generating Registrar Report...")}
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-on-surface-variant font-label-md text-label-md cursor-pointer"
                  type="button"
                >
                  Registrar Report
                </button>
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
    </div>
  );
}