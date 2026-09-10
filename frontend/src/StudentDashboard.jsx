import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function StudentDashboard({ user: userProp, token: tokenProp, onLogout, onToggleRole }) {
  const user = userProp || JSON.parse(localStorage.getItem("user") || "{}");
  const token = tokenProp || localStorage.getItem("token");

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Attendance Section Filters State
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [semesterFilter, setSemesterFilter] = useState("Semester 5");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Schedule Section State
  const [selectedDayIndex, setSelectedDayIndex] = useState(3); // Default Thursday (index 3)

  // Reports Section Modal State
  const [showPetitionModal, setShowPetitionModal] = useState(false);
  const [petitionForm, setPetitionForm] = useState({
    subject: "Operating Systems (CS503) - Dr. Shah",
    classification: "Biometric / Technical Misread Correction",
    date: "2024-09-02",
    justification: "",
  });

  // Settings Section State
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

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/attendance/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Failed to fetch attendance history"
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Stats calculation
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(
    (item) => item.status === "PRESENT"
  ).length;
  const absentClasses = attendance.filter(
    (item) => item.status === "ABSENT"
  ).length;
  const lateClasses = attendance.filter(
    (item) => item.status === "LATE"
  ).length;

  const percentage =
    totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : "84.6";

  const ringDashOffset = 282.7 - (282.7 * Math.min(Number(percentage), 100)) / 100;

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Rahul";
  const fullName = user?.full_name || "Rahul Mehta";
  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RM";

  // Dynamic Date Greeting
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  // Group by subjects for Courses & Reports
  const subjectMap = attendance.reduce((acc, item) => {
    const code = item.subject_code || "GEN101";
    if (!acc[code]) {
      acc[code] = {
        code,
        name: item.subject_name || "General Lecture",
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
    }
    acc[code].total += 1;
    if (item.status === "PRESENT") acc[code].present += 1;
    else if (item.status === "ABSENT") acc[code].absent += 1;
    else if (item.status === "LATE") acc[code].late += 1;
    return acc;
  }, {});

  const subjectList = Object.values(subjectMap);
  const subjectOptions = Array.from(
    new Set([
      "All Subjects",
      ...subjectList.map((s) => s.name),
      "Database Systems",
      "Operating Systems",
      "Mathematics II",
      "Computer Networks",
    ])
  );

  // Filtered Attendance Calculation
  const filteredAttendance = attendance.filter((item) => {
    if (
      subjectFilter !== "All Subjects" &&
      item.subject_name !== subjectFilter &&
      item.subject_code !== subjectFilter
    ) {
      return false;
    }
    if (
      statusFilter !== "Status: All" &&
      item.status.toUpperCase() !== statusFilter.replace("Status: ", "").toUpperCase()
    ) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = (item.subject_name || "").toLowerCase().includes(q);
      const matchCode = (item.subject_code || "").toLowerCase().includes(q);
      const matchStatus = (item.status || "").toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchStatus) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAttendance.length / recordsPerPage) || 1;
  const paginatedAttendance = filteredAttendance.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "attendance", label: "Attendance", icon: "calendar_today" },
    { id: "courses", label: "Courses", icon: "school" },
    { id: "schedule", label: "Schedule", icon: "event_note" },
    { id: "reports", label: "Reports", icon: "bar_chart" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  // Schedule Days Mock Data
  const scheduleDays = [
    { name: "Mon", date: 26, dayName: "Monday", lecturesCount: "3 Lectures" },
    { name: "Tue", date: 27, dayName: "Tuesday", lecturesCount: "4 Lectures, 1 Lab" },
    { name: "Wed", date: 28, dayName: "Wednesday", lecturesCount: "2 Lectures" },
    { name: "Thu", date: 29, dayName: "Thursday", lecturesCount: "4 Lectures" },
    { name: "Fri", date: 30, dayName: "Friday", lecturesCount: "1 Lecture, 2 Labs" },
    { name: "Sat", date: 31, dayName: "Saturday", lecturesCount: "No Classes" },
    { name: "Sun", date: 1, dayName: "Sunday", lecturesCount: "No Classes" },
  ];

  const currentScheduleDay = scheduleDays[selectedDayIndex];

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col md:flex-row">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar (Desktop & Mobile) */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-warm dark:bg-tertiary-container text-primary dark:text-primary-fixed border-r border-border-default dark:border-outline-variant py-margin-desktop z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-6 mb-8 flex justify-between items-center">
          <div>
            <div className="font-display-lg text-display-lg text-primary dark:text-primary-fixed tracking-tight mb-1 font-bold">
              LectureLog
            </div>
            <div className="text-label-sm font-label-sm text-text-stone uppercase tracking-widest">
              Premium Academic Suite
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-text-muted hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-4 mb-6">
          <button
            onClick={() => {
              setShowScanner(true);
              setMobileMenuOpen(false);
            }}
            className="w-full bg-secondary text-white border border-secondary rounded-none py-3 font-label-md text-label-md hover:bg-secondary/90 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
            Start Attendance
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 font-label-md text-label-md transition-all duration-200 ease-in-out w-full text-left active:scale-[0.98] ${
                  isActive
                    ? "text-secondary dark:text-secondary-fixed-dim bg-secondary/5 border-l-4 border-secondary font-semibold"
                    : "text-on-surface-variant dark:text-on-tertiary-container hover:bg-surface-container dark:hover:bg-surface-tint/10"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto px-2 flex flex-col gap-1 border-t border-border-default pt-4 mx-4">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container transition-colors font-label-md text-label-md w-full text-left"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            Help Center
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 transition-colors font-label-md text-label-md w-full text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 w-full max-w-[1400px] mx-auto min-h-screen flex flex-col">
        {/* TopAppBar */}
        <header className="bg-surface-bright dark:bg-background h-16 sticky top-0 z-40 border-b border-border-default dark:border-outline-variant flex justify-between items-center w-full px-4 md:px-margin-desktop shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-on-surface-variant p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="font-headline-lg text-headline-lg font-bold text-primary dark:text-primary-fixed md:hidden">
              LectureLog
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border border-border-default rounded-none py-2 pl-10 pr-4 focus:outline-none focus:border-secondary text-body-md font-body-md"
                placeholder="Search attendance, subjects, reports..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button
                onClick={() => fetchAttendance()}
                title="Refresh Data"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                title="Attendance Log"
                className="hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">history_edu</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
            {onToggleRole && (
              <div className="flex items-center bg-[#F0EDE6] border border-[#D9D4C7] rounded px-2 py-1 text-xs font-medium">
                <span className="text-[#736F68] mr-1 font-semibold hidden sm:inline">Portal:</span>
                <select
                  value="STUDENT"
                  onChange={(e) => onToggleRole(e.target.value)}
                  className="bg-transparent text-[#1C1B1A] font-bold cursor-pointer focus:outline-none"
                  title="Switch application portal preview"
                >
                  <option value="STUDENT">Student Portal</option>
                  <option value="FACULTY">Faculty Portal</option>
                  <option value="HOD">HOD Portal</option>
                </select>
              </div>
            )}
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm border border-border-default">
                {userInitials}
              </div>
              <span className="hidden lg:inline text-sm font-semibold text-primary">
                {fullName}
              </span>
            </div>
          </div>
        </header>

        {/* Global Feedback Message Alert */}
        {message && (
          <div className="mx-4 md:mx-8 mt-4 p-4 bg-info/10 border border-info/30 rounded flex justify-between items-center text-sm text-primary">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-info">info</span>
              {message}
            </span>
            <button
              onClick={() => setMessage("")}
              className="text-text-muted hover:text-primary"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Canvas Content Body */}
        <div className="flex-1 p-margin-mobile md:p-margin-desktop max-w-[1400px] w-full mx-auto pb-24">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Header Banner */}
              <div className="mb-stack-lg border-b border-border-default pb-6">
                <p className="font-label-sm text-label-sm text-text-stone uppercase tracking-widest">
                  {todayFormatted}
                </p>
                <h1 className="font-greeting-serif text-greeting-serif text-primary leading-tight mt-1">
                  {greeting}, {firstName}.
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                <div className="lg:col-span-8 flex flex-col gap-stack-lg">
                  {/* Next Lecture Banner */}
                  <div className="bg-surface-warm border border-border-default p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                            Happening Now
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-lg text-headline-lg text-primary mb-1 font-bold">
                            {attendance[0]?.subject_name || "Database Systems"}
                          </h3>
                          <p className="font-body-lg text-body-lg text-text-stone flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">
                              schedule
                            </span>{" "}
                            10:00 AM - 11:30 AM
                            <span className="mx-2 text-border-default">|</span>
                            <span className="material-symbols-outlined text-lg">
                              room
                            </span>{" "}
                            Room 204
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setActiveTab("attendance")}
                          className="px-6 py-3 bg-primary text-on-primary font-label-md text-label-md rounded-none hover:bg-primary-container transition-colors"
                        >
                          View Class
                        </button>
                        <button
                          onClick={() => setShowScanner(true)}
                          className="px-6 py-3 bg-secondary text-on-secondary font-label-md text-label-md rounded-none hover:bg-secondary-container transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">
                            how_to_reg
                          </span>
                          Mark Attendance
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Today's Timeline */}
                  <div className="mt-4">
                    <h4 className="font-headline-md text-headline-md text-primary mb-6 border-b border-border-default pb-4">
                      Today's Schedule
                    </h4>
                    <div className="flex flex-col ml-2">
                      <div className="timeline-item relative flex gap-6 pb-8 opacity-70">
                        <div className="timeline-line relative z-10 flex-shrink-0 mt-1">
                          <div className="w-6 h-6 rounded-full border-2 border-success bg-surface flex items-center justify-center">
                            <span
                              className="material-symbols-outlined text-success text-xs"
                              style={{ fontVariationSettings: "'wght' 700" }}
                            >
                              check
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="font-label-sm text-label-sm text-text-muted">
                            08:30 AM
                          </span>
                          <h5 className="font-body-lg text-body-lg text-primary font-semibold">
                            Mathematics II
                          </h5>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-success/10 text-success font-label-sm text-label-sm self-start">
                            Present
                          </span>
                        </div>
                      </div>

                      <div className="timeline-item relative flex gap-6 pb-8">
                        <div className="timeline-line relative z-10 flex-shrink-0 mt-1">
                          <div className="w-6 h-6 rounded-full border-2 border-secondary bg-secondary flex items-center justify-center shadow-[0_0_0_4px_rgba(154,69,37,0.1)]">
                            <div className="w-2 h-2 rounded-full bg-surface" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="font-label-sm text-label-sm text-secondary font-semibold">
                            10:00 AM
                          </span>
                          <h5 className="font-headline-md text-body-lg text-primary font-semibold">
                            Database Systems
                          </h5>
                          <p className="font-body-md text-body-md text-text-stone">
                            Room 204 • Prof. Alan Turing
                          </p>
                        </div>
                      </div>

                      <div className="timeline-item relative flex gap-6">
                        <div className="timeline-line relative z-10 flex-shrink-0 mt-1">
                          <div className="w-6 h-6 rounded-full border-2 border-outline-variant bg-surface" />
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="font-label-sm text-label-sm text-text-muted">
                            01:00 PM
                          </span>
                          <h5 className="font-body-lg text-body-lg text-on-surface-variant">
                            Operating Systems
                          </h5>
                          <p className="font-body-md text-body-md text-text-stone">
                            Lab 3B
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-stack-md">
                  {/* Overall Attendance Ring */}
                  <div className="bg-surface-warm border border-border-default p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <h4 className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-6 self-start w-full text-center">
                      Semester Attendance
                    </h4>
                    <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-surface border-[8px] border-surface-container">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" fill="none" r="45" stroke="#DED9CF" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          fill="none"
                          r="45"
                          stroke="#4F7255"
                          strokeWidth="8"
                          strokeDasharray="282.7"
                          strokeDashoffset={ringDashOffset}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="flex flex-col items-center z-10">
                        <span className="font-display-lg text-4xl text-primary font-bold">
                          {percentage}<span className="text-2xl">%</span>
                        </span>
                        <span className="font-label-sm text-label-sm text-text-stone mt-1">
                          Overall
                        </span>
                      </div>
                    </div>
                    <div className="mt-8 w-full flex justify-between px-4 text-center">
                      <div className="flex flex-col gap-1">
                        <span className="font-label-sm text-label-sm text-text-muted">
                          Attended
                        </span>
                        <span className="font-body-lg text-body-lg text-primary font-bold">
                          {presentClasses}
                        </span>
                      </div>
                      <div className="w-[1px] h-full bg-border-default" />
                      <div className="flex flex-col gap-1">
                        <span className="font-label-sm text-label-sm text-text-muted">
                          Total
                        </span>
                        <span className="font-body-lg text-body-lg text-primary font-bold">
                          {totalClasses}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border border-border-default bg-surface-container-low flex gap-4 items-start">
                    <span className="material-symbols-outlined text-info mt-0.5">
                      info
                    </span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant font-semibold">
                        Attendance Standing
                      </p>
                      <p className="font-body-md text-body-md text-text-stone mt-1 text-sm">
                        {Number(percentage) < 75
                          ? "You are near the 75% minimum threshold for Database Systems. Ensure attendance today."
                          : "Your overall attendance is above the 75% requirement. Keep up the consistent check-ins!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ATTENDANCE HISTORY (Editorial Design) */}
          {activeTab === "attendance" && (
            <div>
              {/* Header */}
              <div className="mb-stack-lg border-b border-border-default pb-6">
                <h1 className="font-greeting-serif text-greeting-serif text-primary">
                  Attendance History
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                  Comprehensive record for current semester.
                </p>
              </div>

              {/* Overview & Subject Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg border-b border-border-default pb-stack-lg">
                {/* Left: High Level Stats */}
                <div className="lg:col-span-5 pr-gutter lg:border-r border-border-default">
                  <h2 className="font-headline-md text-headline-md mb-stack-md text-primary font-bold">
                    Overview
                  </h2>
                  <div className="flex items-center gap-8">
                    {/* Ring Chart Visualization */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" fill="none" r="45" stroke="#DED9CF" strokeWidth="8" />
                        <circle
                          className="transition-all duration-1000 ease-out"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="45"
                          stroke="#4F7255"
                          strokeDasharray="282.7"
                          strokeDashoffset={ringDashOffset}
                          strokeWidth="8"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-headline-md text-headline-md font-bold text-primary">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-success rounded-none" />
                          <span className="font-label-md text-label-md text-on-surface-variant">
                            Present
                          </span>
                        </div>
                        <span className="font-body-md text-body-md font-bold">
                          {presentClasses > 0 ? presentClasses : 92}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-error rounded-none" />
                          <span className="font-label-md text-label-md text-on-surface-variant">
                            Absent
                          </span>
                        </div>
                        <span className="font-body-md text-body-md font-bold">
                          {absentClasses > 0 ? absentClasses : 12}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-warning rounded-none" />
                          <span className="font-label-md text-label-md text-on-surface-variant">
                            Late
                          </span>
                        </div>
                        <span className="font-body-md text-body-md font-bold">
                          {lateClasses > 0 ? lateClasses : 3}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Subject Breakdown */}
                <div className="lg:col-span-7">
                  <h2 className="font-headline-md text-headline-md mb-stack-md text-primary font-bold">
                    Subject Breakdown
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Database Systems Card */}
                    <div className="border border-border-default bg-surface-warm p-4 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface-variant mb-1">
                          Database Systems
                        </div>
                        <div className="font-body-md text-body-md font-bold text-primary">
                          72% <span className="text-error ml-2 text-sm font-semibold">! At Risk</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                        warning
                      </span>
                    </div>

                    {/* Operating Systems Card */}
                    <div className="border border-border-default bg-surface p-4 flex justify-between items-center relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-border-default" />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface-variant mb-1">
                          Operating Systems
                        </div>
                        <div className="font-body-md text-body-md font-bold text-primary">
                          88%
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">
                        check_circle
                      </span>
                    </div>

                    {/* Mathematics II Card */}
                    <div className="border border-border-default bg-surface p-4 flex justify-between items-center relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-border-default" />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface-variant mb-1">
                          Mathematics II
                        </div>
                        <div className="font-body-md text-body-md font-bold text-primary">
                          94%
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">
                        check_circle
                      </span>
                    </div>

                    {/* Computer Networks Card */}
                    <div className="border border-border-default bg-surface-warm p-4 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                      <div>
                        <div className="font-label-md text-label-md text-on-surface-variant mb-1">
                          Computer Networks
                        </div>
                        <div className="font-body-md text-body-md font-bold text-primary">
                          78% <span className="text-warning ml-2 text-sm font-semibold">Review</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-warning" style={{ fontVariationSettings: "'FILL' 1" }}>
                        info
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters & Table Section */}
              <div>
                {/* Filters Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-stack-md">
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={subjectFilter}
                      onChange={(e) => {
                        setSubjectFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-surface border border-border-default rounded-none py-2 px-3 font-label-md text-label-md focus:outline-none focus:border-secondary text-primary cursor-pointer pr-8"
                    >
                      {subjectOptions.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>

                    <select
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      className="bg-surface border border-border-default rounded-none py-2 px-3 font-label-md text-label-md focus:outline-none focus:border-secondary text-primary cursor-pointer pr-8"
                    >
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 4">Semester 4</option>
                    </select>

                    <button className="flex items-center gap-2 bg-surface border border-border-default rounded-none py-2 px-3 font-label-md text-label-md hover:bg-surface-container transition-colors text-primary">
                      <span className="material-symbols-outlined text-[18px]">
                        calendar_month
                      </span>
                      Date Range
                    </button>

                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-surface border border-border-default rounded-none py-2 px-3 font-label-md text-label-md focus:outline-none focus:border-secondary text-primary cursor-pointer pr-8"
                    >
                      <option value="Status: All">Status: All</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowScanner(true)}
                    className="bg-secondary text-on-secondary px-4 py-2 text-sm font-semibold flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">
                      qr_code_scanner
                    </span>
                    Mark Attendance
                  </button>
                </div>

                {/* Detailed Table (Editorial Style) */}
                <div className="border border-border-default bg-surface-lowest">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-primary bg-surface-warm">
                        <th className="py-4 px-6 font-label-md text-label-md text-primary font-bold">
                          Date
                        </th>
                        <th className="py-4 px-6 font-label-md text-label-md text-primary font-bold">
                          Subject
                        </th>
                        <th className="py-4 px-6 font-label-md text-label-md text-primary font-bold">
                          Time
                        </th>
                        <th className="py-4 px-6 font-label-md text-label-md text-primary font-bold">
                          Status
                        </th>
                        <th className="py-4 px-6 font-label-md text-label-md text-primary font-bold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md">
                      {paginatedAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-text-stone">
                            No attendance records match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedAttendance.map((item, idx) => {
                          const dateObj = new Date(item.attendance_time);
                          const dateFormatted = dateObj.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                          });
                          const timeFormatted = dateObj.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <tr
                              key={item.id || idx}
                              className={`border-b border-border-default hover:bg-surface-container-low transition-colors group ${
                                item.status === "ABSENT" ? "bg-error-container/20" : ""
                              }`}
                            >
                              <td className="py-4 px-6 text-on-surface-variant font-medium">
                                {dateFormatted}
                              </td>
                              <td className="py-4 px-6 font-medium text-primary">
                                {item.subject_name || "Database Systems"}
                              </td>
                              <td className="py-4 px-6 text-on-surface-variant">
                                {item.status === "ABSENT" ? "—" : timeFormatted}
                              </td>
                              <td className="py-4 px-6">
                                {item.status === "PRESENT" && (
                                  <div className="inline-flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-none text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">
                                      check
                                    </span>
                                    Present
                                  </div>
                                )}
                                {item.status === "LATE" && (
                                  <div className="inline-flex items-center gap-1.5 bg-warning/10 text-warning px-2.5 py-1 rounded-none text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">
                                      schedule
                                    </span>
                                    Late
                                  </div>
                                )}
                                {item.status === "ABSENT" && (
                                  <div className="inline-flex items-center gap-1.5 bg-error/10 text-error px-2.5 py-1 rounded-none text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">
                                      close
                                    </span>
                                    Absent
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="material-symbols-outlined">
                                    more_vert
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Minimalist Pagination */}
                <div className="flex justify-between items-center mt-6 border-t border-border-default pt-4">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Showing {paginatedAttendance.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0}-
                    {Math.min(currentPage * recordsPerPage, filteredAttendance.length)} of{" "}
                    {filteredAttendance.length} records
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      className="border border-border-default px-3 py-1 text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`border px-3 py-1 text-sm ${
                          currentPage === pg
                            ? "border-primary bg-primary text-white"
                            : "border-border-default text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      className="border border-border-default px-3 py-1 text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COURSES */}
          {activeTab === "courses" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-dm-serif text-3xl text-primary">Enrolled Courses</h2>
                <p className="text-xs text-text-muted">
                  Subject-wise attendance tracker & status
                </p>
              </div>

              {subjectList.length === 0 ? (
                <div className="p-8 bg-surface-bright border border-border-default rounded text-center text-text-muted">
                  No courses recorded yet. Mark attendance in class to see subject breakdown!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjectList.map((sub) => {
                    const subPercent =
                      sub.total > 0
                        ? ((sub.present / sub.total) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div
                        key={sub.code}
                        className="bg-surface-bright border border-border-default p-6 rounded-md flex flex-col justify-between gap-4 shadow-xs"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                              {sub.code}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                Number(subPercent) >= 75
                                  ? "bg-success/15 text-success"
                                  : "bg-warning/15 text-warning"
                              }`}
                            >
                              {Number(subPercent) >= 75 ? "On Track" : "At Risk"}
                            </span>
                          </div>
                          <h4 className="font-headline-md text-lg font-semibold text-primary mt-3">
                            {sub.name}
                          </h4>
                          <p className="text-xs text-text-stone mt-1">
                            Lectures Attended: {sub.present} / {sub.total}
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Attendance</span>
                            <span>{subPercent}%</span>
                          </div>
                          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                Number(subPercent) >= 75 ? "bg-success" : "bg-warning"
                              }`}
                              style={{ width: `${Math.min(Number(subPercent), 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCHEDULE (Weekly Timetable Design) */}
          {activeTab === "schedule" && (
            <div>
              {/* Page Header */}
              <div className="mb-stack-lg border-b border-border-default pb-stack-md">
                <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mb-2 font-semibold">
                  {fullName} • CSE-A, Semester 5
                </p>
                <h2 className="font-greeting-serif text-greeting-serif text-primary">
                  Schedule
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
                  Your lectures, labs and upcoming sessions.
                </p>
              </div>

              {/* Week Navigation Selector */}
              <div className="mb-stack-lg">
                <div className="flex justify-between items-center mb-stack-sm border-b border-border-default pb-2">
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">
                    Aug 26 - Sep 1
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-1 border border-border-default text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="p-1 border border-border-default text-on-surface-variant hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-border-default border border-border-default">
                  {scheduleDays.map((day, idx) => {
                    const isSelected = selectedDayIndex === idx;
                    return (
                      <button
                        key={day.name}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`p-4 flex flex-col items-center justify-center min-h-[80px] transition-colors relative ${
                          isSelected
                            ? "bg-secondary text-on-secondary border-b-4 border-primary-container"
                            : "bg-surface-container-lowest hover:bg-surface-container"
                        } ${idx >= 5 && !isSelected ? "opacity-60" : ""}`}
                      >
                        <span
                          className={`font-label-sm text-label-sm uppercase ${
                            isSelected ? "text-on-secondary/80 font-bold" : "text-on-surface-variant"
                          }`}
                        >
                          {day.name}
                        </span>
                        <span
                          className={`font-headline-md text-headline-md mt-1 font-bold ${
                            isSelected ? "text-on-secondary" : "text-primary"
                          }`}
                        >
                          {day.date}
                        </span>
                        {isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-on-secondary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2-Column Schedule Canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                {/* Main Column (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-stack-lg">
                  {/* Next Lecture Highlight */}
                  <section className="border border-border-default bg-surface-container-lowest p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2 py-1 uppercase tracking-wider font-bold">
                            Active Now
                          </span>
                          <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                              schedule
                            </span>
                            10:00 AM - 11:30 AM
                          </span>
                        </div>
                        <h3 className="font-headline-lg text-headline-lg text-primary font-bold">
                          Database Systems
                        </h3>
                        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">
                            person
                          </span>{" "}
                          Dr. Patel
                          <span className="text-border-default">|</span>
                          <span className="material-symbols-outlined text-[20px]">
                            meeting_room
                          </span>{" "}
                          Room 204
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-border-default flex gap-4">
                      <button
                        onClick={() => setShowScanner(true)}
                        className="bg-secondary text-on-secondary font-label-md text-label-md py-2 px-6 hover:bg-secondary-container transition-colors font-semibold"
                      >
                        Mark Attendance
                      </button>
                      <button className="border border-primary text-primary font-label-md text-label-md py-2 px-6 hover:bg-surface-container transition-colors">
                        View Resources
                      </button>
                    </div>
                  </section>

                  {/* Chronological Timeline for Selected Day */}
                  <section>
                    <h3 className="font-headline-md text-headline-md text-primary border-b border-border-default pb-2 mb-stack-md font-bold">
                      {currentScheduleDay.dayName}, Aug {currentScheduleDay.date}
                    </h3>
                    <div className="relative pl-8">
                      {/* Vertical Line */}
                      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border-default" />

                      {/* 09:00 AM: Past */}
                      <div className="relative mb-stack-md flex gap-6 pb-stack-md">
                        <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-success flex items-center justify-center z-10 border-4 border-background">
                          <span className="material-symbols-outlined text-[14px] text-on-primary">
                            check
                          </span>
                        </div>
                        <div className="w-24 shrink-0 pt-1">
                          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                            09:00 AM
                          </span>
                        </div>
                        <div className="flex-1 border border-border-default bg-surface-container-lowest p-4 opacity-75">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold">
                            Mathematics II
                          </h4>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                            Dr. Mehta • Room 112
                          </p>
                        </div>
                      </div>

                      {/* 10:00 AM: Active */}
                      <div className="relative mb-stack-md flex gap-6 pb-stack-md">
                        <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center z-10 border-4 border-background">
                          <div className="w-2 h-2 rounded-full bg-on-secondary animate-pulse" />
                        </div>
                        <div className="w-24 shrink-0 pt-1">
                          <span className="font-label-md text-label-md text-secondary font-semibold">
                            10:00 AM
                          </span>
                        </div>
                        <div className="flex-1 border-l-4 border-secondary border border-border-default bg-surface-container p-4">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold">
                            Database Systems
                          </h4>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                            Dr. Patel • Room 204
                          </p>
                        </div>
                      </div>

                      {/* 12:00 PM: Upcoming */}
                      <div className="relative mb-stack-md flex gap-6 pb-stack-md">
                        <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-background border-2 border-border-default flex items-center justify-center z-10" />
                        <div className="w-24 shrink-0 pt-1">
                          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                            12:00 PM
                          </span>
                        </div>
                        <div className="flex-1 border border-border-default bg-surface-container-lowest p-4 hover:border-outline-variant transition-colors">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold">
                            Operating Systems
                          </h4>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                            Dr. Shah • Lab 3
                          </p>
                        </div>
                      </div>

                      {/* 02:00 PM: Upcoming */}
                      <div className="relative flex gap-6 pb-stack-md">
                        <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-background border-2 border-border-default flex items-center justify-center z-10" />
                        <div className="w-24 shrink-0 pt-1">
                          <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                            02:00 PM
                          </span>
                        </div>
                        <div className="flex-1 border border-border-default bg-surface-container-lowest p-4 hover:border-outline-variant transition-colors">
                          <h4 className="font-headline-md text-headline-md text-primary font-bold">
                            Computer Networks
                          </h4>
                          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                            Dr. Rao • Room 301
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sidebar Column (4 cols) */}
                <aside className="lg:col-span-4">
                  <div className="sticky top-24 border border-border-default bg-surface-warm p-6">
                    <h3 className="font-headline-md text-headline-md text-primary border-b border-border-default pb-2 mb-4 font-bold">
                      Weekly Summary
                    </h3>
                    <ul className="flex flex-col gap-0 border-t border-border-default">
                      {scheduleDays.slice(0, 5).map((d, idx) => (
                        <li
                          key={d.dayName}
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`flex justify-between items-center py-3 border-b border-border-default cursor-pointer transition-colors ${
                            selectedDayIndex === idx
                              ? "bg-secondary/5 -mx-6 px-6 font-bold"
                              : "hover:bg-surface-container"
                          }`}
                        >
                          <span
                            className={`font-label-md text-label-md ${
                              selectedDayIndex === idx
                                ? "text-secondary font-bold"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {d.dayName}
                          </span>
                          <span
                            className={`font-body-md text-body-md ${
                              selectedDayIndex === idx ? "text-secondary font-bold" : "text-primary"
                            }`}
                          >
                            {d.lecturesCount}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 pt-4 border-t border-border-default">
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">
                        Total Hours
                      </p>
                      <p className="font-display-lg text-display-lg text-primary font-bold">
                        24<span className="font-headline-md text-headline-md text-outline font-normal">hrs</span>
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS (Attendance Reports Suite) */}
          {activeTab === "reports" && (
            <div className="flex flex-col w-full gap-stack-lg">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-default">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-stone">
                    {fullName} • CSE-A, Semester 5
                  </span>
                  <h1 className="font-greeting-serif text-greeting-serif text-on-surface leading-tight">
                    Attendance Reports
                  </h1>
                  <p className="font-body-md text-body-md text-text-stone max-w-2xl mt-1">
                    Detailed semester performance, compliance trends, and official academic export summaries.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => alert("Generating and downloading official semester transcript PDF...")}
                    className="px-4 py-2.5 bg-surface-warm text-on-surface border border-border-default font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    <span>Download Semester PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Exporting course-wise tabular records as CSV...")}
                    className="px-5 py-2.5 bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-95 transition-opacity flex items-center gap-2 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Aggregated Standing */}
                <div className="bg-surface-warm border border-border-default p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-border-default/60">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-stone font-semibold">
                      Aggregated Standing
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm bg-success/10 text-success font-semibold">
                      <span className="w-1.5 h-1.5 bg-success rounded-full" />
                      Compliant • Good Standing
                    </span>
                  </div>
                  <div className="py-5">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display-lg text-display-lg font-bold text-on-surface">
                        {percentage}%
                      </span>
                      <span className="font-label-md text-label-md text-text-stone">
                        Overall Rate
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-text-stone mt-1">
                      Mandatory threshold: <span className="font-semibold text-on-surface">75.0%</span> for board clearance
                    </p>
                  </div>
                  <div className="pt-3 border-t border-border-default/60">
                    <div className="w-full bg-surface-container h-1.5 overflow-hidden">
                      <div className="bg-secondary h-full" style={{ width: `${Math.min(Number(percentage), 100)}%` }} />
                    </div>
                    <div className="flex justify-between font-label-sm text-label-sm text-text-stone mt-1.5">
                      <span>Min: 75%</span>
                      <span className="text-on-surface font-medium">Current: {percentage}%</span>
                      <span>Target: 90%</span>
                    </div>
                  </div>
                </div>

                {/* Session Ledger */}
                <div className="bg-surface-warm border border-border-default p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-border-default/60">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-stone font-semibold">
                      Session Ledger
                    </span>
                    <span className="font-label-sm text-label-sm text-text-stone">
                      Term: Autumn 2024
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="bg-surface-container-low p-3 border border-border-default/50">
                      <div className="font-label-sm text-label-sm text-text-stone">Total Conducted</div>
                      <div className="font-headline-md text-headline-md font-semibold text-on-surface mt-1">
                        {totalClasses > 0 ? totalClasses : 107}
                      </div>
                      <div className="font-label-sm text-label-sm text-text-stone mt-0.5">Contact hours</div>
                    </div>
                    <div className="bg-surface-container-low p-3 border border-border-default/50">
                      <div className="font-label-sm text-label-sm text-success font-semibold">Verified Present</div>
                      <div className="font-headline-md text-headline-md font-semibold text-success mt-1">
                        {presentClasses > 0 ? presentClasses : 92}
                      </div>
                      <div className="font-label-sm text-label-sm text-text-stone mt-0.5">85.9% presence</div>
                    </div>
                    <div className="bg-surface-container-low p-3 border border-border-default/50">
                      <div className="font-label-sm text-label-sm text-error font-semibold">Unexcused Absence</div>
                      <div className="font-headline-md text-headline-md font-semibold text-error mt-1">
                        {absentClasses > 0 ? absentClasses : 12}
                      </div>
                      <div className="font-label-sm text-label-sm text-text-stone mt-0.5">Requires audit</div>
                    </div>
                    <div className="bg-surface-container-low p-3 border border-border-default/50">
                      <div className="font-label-sm text-label-sm text-warning font-semibold">Late Markings</div>
                      <div className="font-headline-md text-headline-md font-semibold text-warning mt-1">
                        {lateClasses > 0 ? lateClasses : 3}
                      </div>
                      <div className="font-label-sm text-label-sm text-text-stone mt-0.5">Grace period applied</div>
                    </div>
                  </div>
                  <div className="text-label-sm font-label-sm text-text-stone pt-2 border-t border-border-default/60 flex items-center justify-between">
                    <span>Recorded since: 01 Jul 2024</span>
                    <button onClick={() => setActiveTab("attendance")} className="text-on-surface underline cursor-pointer hover:text-secondary">
                      View full log
                    </button>
                  </div>
                </div>

                {/* Projected Clearance */}
                <div className="bg-surface-warm border border-border-default p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-border-default/60">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-stone font-semibold">
                      Projected Clearance
                    </span>
                    <span className="material-symbols-outlined text-text-stone text-[18px]">
                      verified
                    </span>
                  </div>
                  <div className="py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-success shrink-0" />
                      <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                        Safe for Final Exams
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-text-stone">
                      Candidate has fulfilled statutory criteria across collective course modules. All admit card prerequisites satisfied.
                    </p>
                    <div className="mt-2 p-3 bg-surface-container border-l-2 border-secondary text-label-md font-label-md text-on-surface-variant">
                      Requires <strong class="text-on-surface">8 consecutive sessions</strong> to achieve the 85.0% Dean's Honor Roll cutoff.
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border-default/60 flex items-center justify-between font-label-sm text-label-sm">
                    <span className="text-text-stone">Examination Board Index:</span>
                    <span className="font-semibold text-on-surface">EB-2024-C5-098</span>
                  </div>
                </div>
              </div>

              {/* Curricular Subject Ledger & Temporal Trajectory */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Curricular Subject Ledger
                      </h2>
                      <p className="font-body-md text-body-md text-text-stone">
                        Coursewise verification against semester threshold quotas (75.0%).
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm uppercase text-text-stone tracking-wider font-semibold">
                      4 Modules Enrolled
                    </span>
                  </div>

                  <div className="bg-surface-warm border border-border-default overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-default bg-surface-container-low font-label-sm text-label-sm text-text-stone uppercase tracking-wider">
                          <th className="py-3 px-5">Module & Instructor</th>
                          <th className="py-3 px-4 text-center">Sessions</th>
                          <th className="py-3 px-4">Proportion</th>
                          <th className="py-3 px-4">Status Indicator</th>
                          <th className="py-3 px-4 text-right">Margin / Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/60 font-body-md text-body-md">
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-on-surface">Database Systems</div>
                            <div className="font-label-sm text-label-sm text-text-stone">CS501 • Dr. Patel (Mon, Wed, Fri)</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold text-on-surface">30</span>
                            <span className="text-text-stone font-label-sm">/32</span>
                          </td>
                          <td className="py-4 px-4 w-44">
                            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1.5">
                              <span className="font-semibold text-on-surface">93.8%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-success h-full" style={{ width: "93.8%" }} />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 text-label-sm font-label-sm bg-success/10 text-success font-semibold">
                              Exemplary
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-label-sm text-label-sm text-text-stone font-semibold">
                            +18.8% safety
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-on-surface">Mathematics II</div>
                            <div className="font-label-sm text-label-sm text-text-stone">MA504 • Dr. Mehta (Tue, Thu)</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold text-on-surface">26</span>
                            <span className="text-text-stone font-label-sm">/28</span>
                          </td>
                          <td className="py-4 px-4 w-44">
                            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1.5">
                              <span className="font-semibold text-on-surface">92.9%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-success h-full" style={{ width: "92.9%" }} />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 text-label-sm font-label-sm bg-success/10 text-success font-semibold">
                              Exemplary
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-label-sm text-label-sm text-text-stone font-semibold">
                            +17.9% safety
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-on-surface">Computer Networks</div>
                            <div className="font-label-sm text-label-sm text-text-stone">CS502 • Dr. Rao (Mon, Wed)</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold text-on-surface">21</span>
                            <span className="text-text-stone font-label-sm">/27</span>
                          </td>
                          <td className="py-4 px-4 w-44">
                            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1.5">
                              <span className="font-semibold text-warning">77.8%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-warning h-full" style={{ width: "77.8%" }} />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-label-sm font-label-sm bg-warning/10 text-warning font-semibold">
                              <span className="material-symbols-outlined text-[13px]">warning</span>
                              Review Needed
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-label-sm text-label-sm text-warning font-semibold">
                            +2.8% above limit
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-on-surface">Operating Systems</div>
                            <div className="font-label-sm text-label-sm text-text-stone">CS503 • Dr. Shah (Tue, Thu, Fri)</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-semibold text-on-surface">15</span>
                            <span className="text-text-stone font-label-sm">/20</span>
                          </td>
                          <td className="py-4 px-4 w-44">
                            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1.5">
                              <span className="font-semibold text-error">75.0%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-error h-full" style={{ width: "75.0%" }} />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-label-sm font-label-sm bg-error/10 text-error font-semibold">
                              <span className="material-symbols-outlined text-[13px]">error</span>
                              At Risk
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-label-sm text-label-sm text-error font-semibold">
                            0.0% buffer (critical)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-surface-container-low border border-border-default flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                      info
                    </span>
                    <div className="font-body-md text-body-md text-on-surface text-sm">
                      <strong className="font-semibold">Statutory Advisory on Operating Systems (CS503):</strong>{" "}
                      Your presence is currently locked exactly on the institutional threshold boundary (75.0%). Missing any further lecture without validated medical or institutional dispensation will trigger formal debarment warnings under Regulation 14.3.
                    </div>
                  </div>
                </div>

                {/* Right Column (4 cols) - Temporal Trajectory */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="pb-2 border-b border-border-default">
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Temporal Trajectory
                      </h2>
                      <p className="font-body-md text-body-md text-text-stone">
                        Monthly compliance & daily distributions
                      </p>
                    </div>

                    <div className="bg-surface-warm border border-border-default p-5 flex flex-col gap-5">
                      <div>
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-stone block mb-3 font-semibold">
                          Monthly Index Sequence
                        </span>
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="flex justify-between font-label-md text-label-md mb-1">
                              <span className="text-on-surface">July 2024</span>
                              <span className="font-semibold text-on-surface">91.2%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-on-surface h-full" style={{ width: "91.2%" }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-label-md text-label-md mb-1">
                              <span className="text-on-surface">August 2024</span>
                              <span className="font-semibold text-on-surface">84.6%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-secondary h-full" style={{ width: "84.6%" }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between font-label-md text-label-md mb-1">
                              <span className="text-on-surface">September 2024 (Projected)</span>
                              <span className="font-semibold text-text-stone">86.0%</span>
                            </div>
                            <div className="w-full bg-surface-container h-1.5">
                              <div className="bg-text-stone/60 h-full border-dashed" style={{ width: "86.0%" }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border-default">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-stone block mb-3 font-semibold">
                          Weekday Distribution Pattern
                        </span>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div className="flex flex-col items-center gap-1.5 bg-surface-container-low p-2 border border-border-default/40">
                            <span className="font-label-sm text-label-sm text-text-stone">Mon</span>
                            <div className="w-full bg-surface-container h-12 flex items-end justify-center">
                              <div className="w-full bg-on-surface" style={{ height: "96%" }} />
                            </div>
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface">96%</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 bg-surface-container-low p-2 border border-border-default/40">
                            <span className="font-label-sm text-label-sm text-text-stone">Tue</span>
                            <div className="w-full bg-surface-container h-12 flex items-end justify-center">
                              <div className="w-full bg-on-surface" style={{ height: "88%" }} />
                            </div>
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface">88%</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 bg-surface-container-low p-2 border border-border-default/40">
                            <span className="font-label-sm text-label-sm text-text-stone">Wed</span>
                            <div className="w-full bg-surface-container h-12 flex items-end justify-center">
                              <div className="w-full bg-on-surface" style={{ height: "82%" }} />
                            </div>
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface">82%</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 bg-surface-container-low p-2 border border-border-default/40">
                            <span className="font-label-sm text-label-sm text-warning font-semibold">Thu</span>
                            <div className="w-full bg-surface-container h-12 flex items-end justify-center">
                              <div className="w-full bg-warning" style={{ height: "78%" }} />
                            </div>
                            <span className="font-label-sm text-label-sm font-semibold text-warning">78%</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 bg-surface-container-low p-2 border border-border-default/40">
                            <span className="font-label-sm text-label-sm text-warning font-semibold">Fri</span>
                            <div className="w-full bg-surface-container h-12 flex items-end justify-center">
                              <div className="w-full bg-warning" style={{ height: "80%" }} />
                            </div>
                            <span className="font-label-sm text-label-sm font-semibold text-warning">80%</span>
                          </div>
                        </div>
                        <p className="font-label-sm text-label-sm text-text-stone mt-2.5 leading-tight">
                          Observed pattern: Significant 16% variance between Monday commencement and Thursday/Friday late laboratory windows.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Exemption & Duty Leave Records */}
              <div className="flex flex-col gap-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                      Official Exemption & Duty Leave Records
                    </h2>
                    <p className="font-body-md text-body-md text-text-stone">
                      Authorized institutional dispensations, Dean clearances, and health infirmary credits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPetitionModal(true)}
                    className="px-4 py-2 bg-transparent text-secondary border border-secondary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-2 self-start sm:self-auto font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">post_add</span>
                    <span>Request Attendance Rectification / Leave Credit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Record 1 */}
                  <div className="bg-surface-warm border border-border-default p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">14 Aug 2024</span>
                        <span className="font-label-sm text-label-sm text-text-stone">• Reference: DL-CS-402</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 text-label-sm font-label-sm bg-success/10 text-success font-semibold">
                        Approved by HOD
                      </span>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-on-surface text-body-md">Inter-college Smart City Hackathon</h3>
                      <p className="font-label-md text-label-md text-text-stone mt-1">
                        Official delegation deputed to representation at National Institute of Design. Duty leave sanctions granted for 4 total sessions.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border-default/60 flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-text-stone">Remedy: Full Attendance Credit Granted</span>
                      <span className="text-on-surface font-mono">Signatory: Prof. K. Sharma</span>
                    </div>
                  </div>

                  {/* Record 2 */}
                  <div className="bg-surface-warm border border-border-default p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">02 Aug 2024</span>
                        <span className="font-label-sm text-label-sm text-text-stone">• Reference: MED-24-118</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 text-label-sm font-label-sm bg-success/10 text-success font-semibold">
                        Health Center Verified
                      </span>
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-on-surface text-body-md">Acute Febrile Illness / Campus Health Wing</h3>
                      <p className="font-label-md text-label-md text-text-stone mt-1">
                        Outpatient registry entry confirmed by Medical Officer Dr. M. Iyer. Absence on Day 2 of Term excused without academic grade penalty.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border-default/60 flex items-center justify-between font-label-sm text-label-sm">
                      <span className="text-text-stone">Remedy: Attendance Excused (Statutory Minimum Preserved)</span>
                      <span className="text-on-surface font-mono">Reg: MO-HC-9921</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lodge Rectification Petition Modal */}
              {showPetitionModal && (
                <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-surface-warm border border-border-default max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl relative">
                    <div className="flex items-start justify-between border-b border-border-default pb-3">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">Lodge Rectification Petition</h3>
                        <p className="font-label-md text-label-md text-text-stone">Submits directly to Academic Department Office</p>
                      </div>
                      <button
                        type="button"
                        className="text-text-stone hover:text-on-surface p-1"
                        onClick={() => setShowPetitionModal(false)}
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                    <div className="flex flex-col gap-3 font-body-md text-body-md">
                      <div>
                        <label className="block font-label-sm text-label-sm uppercase text-text-stone mb-1 font-semibold">Subject Module</label>
                        <select
                          value={petitionForm.subject}
                          onChange={(e) => setPetitionForm({ ...petitionForm, subject: e.target.value })}
                          className="w-full bg-surface-container-low border border-border-default p-2 text-on-surface font-label-md text-label-md focus:outline-none focus:border-secondary"
                        >
                          <option>Operating Systems (CS503) - Dr. Shah</option>
                          <option>Computer Networks (CS502) - Dr. Rao</option>
                          <option>Database Systems (CS501) - Dr. Patel</option>
                          <option>Mathematics II (MA504) - Dr. Mehta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-sm text-label-sm uppercase text-text-stone mb-1 font-semibold">Petition Classification</label>
                        <select
                          value={petitionForm.classification}
                          onChange={(e) => setPetitionForm({ ...petitionForm, classification: e.target.value })}
                          className="w-full bg-surface-container-low border border-border-default p-2 text-on-surface font-label-md text-label-md focus:outline-none focus:border-secondary"
                        >
                          <option>Biometric / Technical Misread Correction</option>
                          <option>Medical Exemption / Certificate Upload</option>
                          <option>Authorized Institutional / Sports Duty</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-sm text-label-sm uppercase text-text-stone mb-1 font-semibold">Session Date</label>
                        <input
                          type="date"
                          value={petitionForm.date}
                          onChange={(e) => setPetitionForm({ ...petitionForm, date: e.target.value })}
                          className="w-full bg-surface-container-low border border-border-default p-2 text-on-surface font-label-md text-label-md focus:outline-none focus:border-secondary"
                        />
                      </div>
                      <div>
                        <label className="block font-label-sm text-label-sm uppercase text-text-stone mb-1 font-semibold">Justification Brief</label>
                        <textarea
                          rows={3}
                          value={petitionForm.justification}
                          onChange={(e) => setPetitionForm({ ...petitionForm, justification: e.target.value })}
                          className="w-full bg-surface-container-low border border-border-default p-2 text-on-surface font-label-md text-label-md focus:outline-none focus:border-secondary"
                          placeholder="Provide factual context and reference document IDs..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
                      <button
                        type="button"
                        onClick={() => setShowPetitionModal(false)}
                        className="px-4 py-2 border border-border-default text-on-surface font-label-md text-label-md hover:bg-surface-container"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const refId = "APP-" + Math.floor(1000 + Math.random() * 9000);
                          alert(`Formal petition successfully filed under reference ${refId}. Your department advisor will verify within 48 hours.`);
                          setShowPetitionModal(false);
                        }}
                        className="px-5 py-2 bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-95 font-semibold"
                      >
                        Submit to Academic Dean
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SETTINGS (Full Academic Settings Suite) */}
          {activeTab === "settings" && (
            <div className="flex flex-col w-full">
              {/* Page Header & Academic Metainfo */}
              <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-border-default gap-6">
                <div className="flex flex-col max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                      Account & Preferences
                    </span>
                    <span className="text-text-stone text-[12px] font-label-sm">•</span>
                    <span className="font-label-sm text-label-sm text-text-stone uppercase tracking-widest">
                      Academic Year 2024–25
                    </span>
                  </div>
                  <h1 className="font-greeting-serif text-greeting-serif text-on-surface leading-none tracking-tight">
                    Settings
                  </h1>
                  <p className="font-body-md text-body-md text-text-stone mt-3">
                    Manage your student profile, verification devices, notification alerts, and security credentials across the institutional network.
                  </p>
                </div>

                {/* Quick Status Strip */}
                <div className="flex items-center gap-4 bg-surface-warm p-4 rounded-lg border border-border-default self-start md:self-auto">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-text-stone uppercase">Academic Stance</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Good Standing ({percentage}% Avg)
                    </span>
                  </div>
                  <div className="h-8 w-px bg-border-default" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-text-stone uppercase">Hardware Trust</span>
                    <span className="font-label-md text-label-md text-secondary font-semibold flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      Secured Enclave
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Layout Grid: Sidebar Tabs + Content Pane */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                {/* Navigation Column (3 cols) */}
                <aside className="lg:col-span-3 flex flex-col gap-6">
                  <nav className="flex flex-col bg-surface-warm rounded-lg border border-border-default divide-y divide-border-default">
                    <button
                      type="button"
                      onClick={() => setSettingsSection("section-profile")}
                      className={`text-left px-5 py-4 flex items-center justify-between group transition-colors border-l-4 ${
                        settingsSection === "section-profile"
                          ? "bg-surface-container font-semibold text-on-surface border-secondary"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${settingsSection === "section-profile" ? "text-secondary" : "text-text-stone"}`}>
                          badge
                        </span>
                        <span className="font-label-md text-label-md">Profile & Identity</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-text-stone group-hover:translate-x-0.5 transition-transform">
                        chevron_right
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsSection("section-device")}
                      className={`text-left px-5 py-4 flex items-center justify-between group transition-colors border-l-4 ${
                        settingsSection === "section-device"
                          ? "bg-surface-container font-semibold text-on-surface border-secondary"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${settingsSection === "section-device" ? "text-secondary" : "text-text-stone"}`}>
                          location_searching
                        </span>
                        <span className="font-label-md text-label-md">Geolocation & Device</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-text-stone group-hover:translate-x-0.5 transition-transform">
                        chevron_right
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsSection("section-notifications")}
                      className={`text-left px-5 py-4 flex items-center justify-between group transition-colors border-l-4 ${
                        settingsSection === "section-notifications"
                          ? "bg-surface-container font-semibold text-on-surface border-secondary"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${settingsSection === "section-notifications" ? "text-secondary" : "text-text-stone"}`}>
                          notifications_active
                        </span>
                        <span className="font-label-md text-label-md">Notifications & Alerts</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-text-stone group-hover:translate-x-0.5 transition-transform">
                        chevron_right
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsSection("section-security")}
                      className={`text-left px-5 py-4 flex items-center justify-between group transition-colors border-l-4 ${
                        settingsSection === "section-security"
                          ? "bg-surface-container font-semibold text-on-surface border-secondary"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${settingsSection === "section-security" ? "text-secondary" : "text-text-stone"}`}>
                          shield
                        </span>
                        <span className="font-label-md text-label-md">Security & Sessions</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-text-stone group-hover:translate-x-0.5 transition-transform">
                        chevron_right
                      </span>
                    </button>
                  </nav>

                  {/* Institutional Notice Card */}
                  <div className="bg-surface-warm p-5 rounded-lg border border-border-default flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-warning">
                      <span className="material-symbols-outlined text-[20px]">info</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                        Institutional Lock
                      </span>
                    </div>
                    <p className="font-body-md text-[13px] leading-relaxed text-text-stone">
                      Core degree attributes and RFID token bindings are cryptographically signed by the Registrar’s Office. Submissions to amend require Form REG-11B.
                    </p>
                    <div className="pt-2 border-t border-border-default flex items-center justify-between">
                      <span className="font-label-sm text-[11px] text-text-stone uppercase font-mono tracking-wider">
                        Sync: Auto (LMS-v4)
                      </span>
                      <a href="#" className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1 font-semibold">
                        Registry Portal
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </aside>

                {/* Content Panels Container (9 cols) */}
                <main className="lg:col-span-9 flex flex-col gap-10">
                  {/* SECTION 1: PROFILE & IDENTITY */}
                  {(settingsSection === "section-profile" || settingsSection === "all") && (
                    <section className="flex flex-col gap-6">
                      <div className="flex flex-col border-b border-border-default pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                              Identity Matrix
                            </span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-0.5 font-bold">
                              Profile & Registry
                            </h2>
                          </div>
                          <span className="px-2.5 py-1 bg-surface-container rounded font-label-sm text-label-sm text-text-stone border border-border-default uppercase tracking-wider font-semibold">
                            Enrolled • Verified
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-text-stone mt-1">
                          Personal identity credentials and immutable academic affiliations verified by the university directory.
                        </p>
                      </div>

                      {/* Student Master Card */}
                      <div className="bg-surface-warm rounded-lg border border-border-default p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="relative shrink-0">
                          <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary text-on-secondary border-2 border-border-default flex items-center justify-center font-bold text-3xl">
                            {userInitials}
                          </div>
                          <button
                            type="button"
                            title="Upload new portrait photo"
                            className="absolute bottom-0 right-0 p-1.5 bg-primary text-on-primary rounded-full hover:bg-on-surface-variant transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px] block">photo_camera</span>
                          </button>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                              {fullName}
                            </h3>
                            <span className="px-2 py-0.5 bg-success/10 text-success rounded font-label-sm text-label-sm uppercase font-semibold">
                              Undergraduate
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 mt-2 font-body-md text-text-stone text-[14px]">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-text-stone">fingerprint</span>
                              <span>Roll No: <span className="font-medium text-on-surface font-mono">21CSE041</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-text-stone">mail</span>
                              <span className="font-mono text-on-surface">{user?.email || "rahul.mehta@university.edu"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-text-stone">call</span>
                              <span>+91 98450 12890</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-text-stone">calendar_month</span>
                              <span>Cohort: 2022 – 2026</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex md:flex-col gap-2 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={() => alert("Contact detail editing window opened.")}
                            className="flex-1 md:flex-initial px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-border-default rounded font-label-md text-label-md text-on-surface font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Edit Contact
                          </button>
                        </div>
                      </div>

                      {/* Read-Only Institutional Record */}
                      <div className="bg-surface-warm rounded-lg border border-border-default overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-default bg-surface-container-low flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-secondary">account_balance</span>
                            <span className="font-label-md text-label-md font-semibold text-on-surface">Institutional Ledger Record</span>
                          </div>
                          <span className="font-label-sm text-[11px] text-text-stone font-mono uppercase tracking-wider">Registrar Seal: Signed #8841-B</span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Institution / University</label>
                            <div className="px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-body-md text-on-surface flex items-center justify-between">
                              <span>St. Xavier’s College of Engineering & Technology</span>
                              <span className="material-symbols-outlined text-[18px] text-text-stone">lock</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Academic Department</label>
                            <div className="px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-body-md text-on-surface flex items-center justify-between">
                              <span>Computer Science & Engineering</span>
                              <span className="material-symbols-outlined text-[18px] text-text-stone">lock</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Section & Current Semester</label>
                            <div className="px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-body-md text-on-surface flex items-center justify-between">
                              <span>CSE-A • Semester 5 (Class of 2026)</span>
                              <span className="material-symbols-outlined text-[18px] text-text-stone">lock</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold">Physical RFID Token Identifier</label>
                            <div className="px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-body-md text-on-surface flex items-center justify-between">
                              <div className="flex items-center gap-2 font-mono text-[14px]">
                                <span className="w-2 h-2 rounded-full bg-success" />
                                <span>ID-9042-8812</span>
                                <span className="text-text-stone font-label-sm text-[11px]">(Active & Paired)</span>
                              </div>
                              <span className="material-symbols-outlined text-[18px] text-text-stone">nfc</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-3 bg-surface-container-low border-t border-border-default flex items-center justify-between text-[13px] text-text-stone">
                          <span>Discrepancies in course catalog or section assignment?</span>
                          <a href="#" className="font-semibold text-secondary hover:underline">Submit Academic Dispute Ticket →</a>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* SECTION 2: GEOLOCATION & HARDWARE VERIFICATION */}
                  {(settingsSection === "section-device" || settingsSection === "all") && (
                    <section className="flex flex-col gap-6">
                      <div className="flex flex-col border-b border-border-default pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">Hardware Telemetry</span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-0.5 font-bold">Geolocation & Device</h2>
                          </div>
                          <span className="px-2.5 py-1 bg-success/10 text-success rounded font-label-sm text-label-sm font-semibold uppercase tracking-wider">
                            Enclave Verified
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-text-stone mt-1">
                          Configure biometric hardware, beacon handshakes, and micro-geofencing parameters for instantaneous in-lecture attendance confirmation.
                        </p>
                      </div>

                      {/* Primary Device Card */}
                      <div className="bg-surface-warm rounded-lg border border-border-default p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-container border border-border-default flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[28px] text-secondary">smartphone</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h3 className="font-label-md text-[17px] font-semibold text-on-surface">iPhone 15 Pro</h3>
                              <span className="px-2 py-0.5 bg-surface-container rounded text-text-stone font-label-sm text-[11px] uppercase font-mono">This Device</span>
                            </div>
                            <p className="font-body-md text-[13px] text-text-stone mt-0.5">
                              Hardware UUID: <span className="font-mono text-on-surface">FA88-29B1-90E2-44AC</span> • iOS 17.5.1
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 font-label-sm text-label-sm text-success font-semibold">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>Paired for Classroom Geofence & BLE Verification</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => alert("Hardware diagnostics clean: BLE 5.3 Ok, GPS accuracy ± 3 meters.")}
                            className="px-3.5 py-2 border border-border-default rounded font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors font-semibold"
                          >
                            Device Diagnostics
                          </button>
                          <button
                            type="button"
                            onClick={() => alert("Device unpairing requires password confirmation.")}
                            className="px-3.5 py-2 border border-error/30 text-error hover:bg-error/5 rounded font-label-md text-label-md transition-colors font-semibold"
                          >
                            Unpair
                          </button>
                        </div>
                      </div>

                      {/* Toggle Controls Stack */}
                      <div className="bg-surface-warm rounded-lg border border-border-default divide-y divide-border-default">
                        {/* BLE Beacons */}
                        <div className="p-6 flex items-start justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-[24px] text-secondary shrink-0 mt-0.5">podcasts</span>
                            <div className="flex flex-col">
                              <label className="font-label-md text-label-md font-semibold text-on-surface cursor-pointer" onClick={() => setToggleBle(!toggleBle)}>
                                Bluetooth Beacon Proximity Handshake
                              </label>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-xl">
                                Enable instant BLE classroom check-in detection when entering designated lecture halls (L-101 through L-408).
                              </p>
                              <span className="font-label-sm text-[12px] text-text-stone mt-1.5 flex items-center gap-1 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                Active Protocol: iBeacon / Eddystone 2.4GHz
                              </span>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input type="checkbox" checked={toggleBle} onChange={(e) => setToggleBle(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                          </label>
                        </div>

                        {/* High Precision GPS */}
                        <div className="p-6 flex items-start justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-[24px] text-secondary shrink-0 mt-0.5">my_location</span>
                            <div className="flex flex-col">
                              <label className="font-label-md text-label-md font-semibold text-on-surface cursor-pointer" onClick={() => setToggleGps(!toggleGps)}>
                                High-Precision Location Services
                              </label>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-xl">
                                Allow 10-meter classroom radius validation during live lecture roll calls to prevent off-campus spoofing.
                              </p>
                              <span className="font-label-sm text-[12px] text-text-stone mt-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-success">lock</span>
                                Coordinates are discarded immediately post-validation; zero location trace kept.
                              </span>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input type="checkbox" checked={toggleGps} onChange={(e) => setToggleGps(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                          </label>
                        </div>

                        {/* Face Biometric Data */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-low/50">
                          <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-[24px] text-secondary shrink-0 mt-0.5">face</span>
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md font-semibold text-on-surface">Face Biometric Hash & Vector</span>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-xl">
                                Stored securely on local device enclave. Mathematical vectors are compared against classroom terminal camera feeds without cloud transfer.
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="font-label-sm text-[11px] font-mono text-text-stone uppercase">Enrolled: 12 Aug 2024</span>
                                <span className="text-text-stone">•</span>
                                <span className="font-label-sm text-[11px] font-mono text-success uppercase font-semibold">Hash Validated</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert("Face ID re-enrollment camera launched.")}
                            className="shrink-0 px-4 py-2 border border-secondary text-secondary hover:bg-secondary hover:text-on-secondary rounded font-label-md text-label-md font-semibold transition-colors flex items-center gap-2 self-start md:self-auto"
                          >
                            <span className="material-symbols-outlined text-[18px]">cached</span>
                            Re-scan Face ID
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* SECTION 3: NOTIFICATION & ALERT THRESHOLDS */}
                  {(settingsSection === "section-notifications" || settingsSection === "all") && (
                    <section className="flex flex-col gap-6">
                      <div className="flex flex-col border-b border-border-default pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">Alert Dispatch</span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-0.5 font-bold">Notification & Thresholds</h2>
                          </div>
                          <span className="px-2.5 py-1 bg-surface-container rounded font-label-sm text-label-sm text-text-stone border border-border-default uppercase tracking-wider font-semibold">
                            Push • Email
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-text-stone mt-1">
                          Configure safety margins, lecture alert intervals, and attendance short-fall warnings before dean escalation.
                        </p>
                      </div>

                      <div className="bg-surface-warm rounded-lg border border-border-default divide-y divide-border-default">
                        {/* Deficit Warning System */}
                        <div className="p-6 flex items-start justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-warning/10 text-warning flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-[22px]">warning</span>
                            </div>
                            <div className="flex flex-col">
                              <label className="font-label-md text-label-md font-semibold text-on-surface cursor-pointer" onClick={() => setToggleThreshold(!toggleThreshold)}>
                                Deficit Warning System (Below 80%)
                              </label>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-xl">
                                Send immediate priority push and email alerts when any individual course drops below the statutory 80.0% exam eligibility floor.
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="font-label-sm text-label-sm text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded">
                                  Mandatory Academic Threshold
                                </span>
                              </div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input type="checkbox" checked={toggleThreshold} onChange={(e) => setToggleThreshold(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                          </label>
                        </div>

                        {/* Upcoming Lecture Lead Time */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-surface-container text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-[22px]">schedule</span>
                            </div>
                            <div className="flex flex-col">
                              <label className="font-label-md text-label-md font-semibold text-on-surface" htmlFor="select-reminder">
                                Upcoming Lecture Lead Time
                              </label>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-lg">
                                Choose advance notification time window before each timetable block begins, including room transfer estimates.
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 w-full md:w-64">
                            <select
                              id="select-reminder"
                              value={selectReminder}
                              onChange={(e) => setSelectReminder(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-[14px] text-on-surface focus:outline-none focus:border-secondary transition-colors"
                            >
                              <option value="5">5 minutes before lecture</option>
                              <option value="10">10 minutes before lecture</option>
                              <option value="15">15 minutes before lecture</option>
                              <option value="30">30 minutes before lecture</option>
                              <option value="none">Disabled</option>
                            </select>
                          </div>
                        </div>

                        {/* Daily Attendance Summary */}
                        <div className="p-6 flex items-start justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-surface-container text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-[22px]">summarize</span>
                            </div>
                            <div className="flex flex-col">
                              <label className="font-label-md text-label-md font-semibold text-on-surface cursor-pointer" onClick={() => setToggleDigest(!toggleDigest)}>
                                Daily Attendance Evening Digest
                              </label>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-xl">
                                Receive an automated recap report at 6:00 PM highlighting logged lectures, recorded absences, and updated course percentages.
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input type="checkbox" checked={toggleDigest} onChange={(e) => setToggleDigest(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                          </label>
                        </div>

                        {/* Real-time Check-in Receipts */}
                        <div className="p-6 flex items-start justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-surface-container text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                            </div>
                            <div className="flex flex-col">
                              <label className="font-label-md text-label-md font-semibold text-on-surface cursor-pointer" onClick={() => setToggleReceipt(!toggleReceipt)}>
                                Real-time Check-in Receipts
                              </label>
                              <p className="font-body-md text-[14px] text-text-stone mt-1 max-w-xl">
                                Trigger an instantaneous silent push ping confirmation with transaction hash immediately upon faculty terminal acceptance.
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                            <input type="checkbox" checked={toggleReceipt} onChange={(e) => setToggleReceipt(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
                          </label>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* SECTION 4: SECURITY & SESSIONS */}
                  {(settingsSection === "section-security" || settingsSection === "all") && (
                    <section className="flex flex-col gap-6">
                      <div className="flex flex-col border-b border-border-default pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">Access Control</span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-0.5 font-bold">Security & Password</h2>
                          </div>
                          <span className="px-2.5 py-1 bg-success/10 text-success rounded font-label-sm text-label-sm font-semibold uppercase tracking-wider">
                            2FA Enabled
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-text-stone mt-1">
                          Maintain account passwords, multi-factor authenticators, and terminate dormant network sessions.
                        </p>
                      </div>

                      {/* Password Change Box */}
                      <div className="bg-surface-warm rounded-lg border border-border-default p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-default">
                          <div>
                            <h3 className="font-headline-md text-[20px] text-on-surface font-bold">Update Password</h3>
                            <p className="font-body-md text-[14px] text-text-stone mt-0.5">Passwords must contain at least 12 characters, numbers, and symbols.</p>
                          </div>
                          <span className="material-symbols-outlined text-text-stone text-[22px]">password</span>
                        </div>
                        <form className="grid grid-cols-1 md:grid-cols-3 gap-6" onSubmit={(e) => e.preventDefault()}>
                          <div className="flex flex-col gap-2">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold" htmlFor="current-pwd">Current Password</label>
                            <div className="relative">
                              <input
                                id="current-pwd"
                                type={pwdShow ? "text" : "password"}
                                value={currentPwd}
                                onChange={(e) => setCurrentPwd(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-[14px] text-on-surface focus:outline-none focus:border-secondary font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setPwdShow(!pwdShow)}
                                className="absolute right-3 top-2.5 text-text-stone hover:text-on-surface"
                                title="Reveal password"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {pwdShow ? "visibility_off" : "visibility"}
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold" htmlFor="new-pwd">New Password</label>
                            <div className="relative">
                              <input
                                id="new-pwd"
                                type={pwdShow ? "text" : "password"}
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-[14px] text-on-surface focus:outline-none focus:border-secondary font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="font-label-sm text-label-sm text-text-stone uppercase tracking-wider font-semibold" htmlFor="confirm-pwd">Confirm Password</label>
                            <div className="relative">
                              <input
                                id="confirm-pwd"
                                type={pwdShow ? "text" : "password"}
                                value={confirmPwd}
                                onChange={(e) => setConfirmPwd(e.target.value)}
                                placeholder="Repeat new password"
                                className="w-full px-3.5 py-2.5 bg-surface-container rounded border border-border-default font-body-md text-[14px] text-on-surface focus:outline-none focus:border-secondary font-mono"
                              />
                            </div>
                          </div>
                        </form>
                        <div className="mt-6 pt-4 border-t border-border-default flex items-center justify-between">
                          <span className="font-label-sm text-[12px] text-text-stone">Last modified: 42 days ago</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newPwd || newPwd !== confirmPwd) {
                                alert("New passwords do not match!");
                                return;
                              }
                              alert("Password credentials updated successfully.");
                              setCurrentPwd("");
                              setNewPwd("");
                              setConfirmPwd("");
                            }}
                            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-border-default rounded font-label-md text-label-md text-on-surface font-semibold transition-colors"
                          >
                            Update Credential
                          </button>
                        </div>
                      </div>

                      {/* Two-Factor Authentication Status */}
                      <div className="bg-surface-warm rounded-lg border border-border-default p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[26px]">vpn_key</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h3 className="font-label-md text-[17px] font-semibold text-on-surface">Two-Factor Authentication (2FA)</h3>
                              <span className="px-2 py-0.5 bg-success/10 text-success rounded font-label-sm text-label-sm font-semibold uppercase">Active</span>
                            </div>
                            <p className="font-body-md text-[14px] text-text-stone mt-1">
                              Secured through <span className="font-medium text-on-surface">Campus Authenticator (TOTP)</span>. Secondary passcode requested on all off-campus logins.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("TOTP key configuration modal opened.")}
                          className="shrink-0 px-4 py-2 border border-border-default hover:bg-surface-container rounded font-label-md text-label-md text-on-surface font-semibold transition-colors"
                        >
                          Configure Keys
                        </button>
                      </div>

                      {/* Active Sessions Registry */}
                      <div className="bg-surface-warm rounded-lg border border-border-default overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-surface-container-low">
                          <div>
                            <span className="font-label-md text-label-md font-semibold text-on-surface">Active Logged-in Sessions</span>
                            <p className="font-label-sm text-[12px] text-text-stone mt-0.5">Revoke unrecognised device access immediately.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert("All other active sessions terminated.")}
                            className="font-label-sm text-label-sm text-error hover:underline font-semibold"
                          >
                            Terminate Other Sessions
                          </button>
                        </div>
                        <div className="divide-y divide-border-default">
                          {/* Session 1: Mobile */}
                          <div className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-surface-container border border-border-default flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[20px] text-on-surface">phone_iphone</span>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-label-md text-label-md font-semibold text-on-surface">Mobile App • iOS 17.5</span>
                                  <span className="px-2 py-0.2 bg-success/15 text-success rounded font-label-sm text-[11px] font-semibold uppercase">Current Device</span>
                                </div>
                                <span className="font-body-md text-[13px] text-text-stone mt-0.5">
                                  Campus Wi-Fi (Hostel-Block-C) • IP: <span className="font-mono">10.14.88.204</span>
                                </span>
                              </div>
                            </div>
                            <span className="font-label-sm text-[12px] text-success font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-success" />
                              Active now
                            </span>
                          </div>

                          {/* Session 2: Desktop */}
                          <div className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-surface-container border border-border-default flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[20px] text-on-surface">laptop_mac</span>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-label-md text-label-md font-semibold text-on-surface">Chrome Browser • macOS Sonoma</span>
                                </div>
                                <span className="font-body-md text-[13px] text-text-stone mt-0.5">
                                  Bengaluru, India • IP: <span className="font-mono">115.240.90.12</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-label-sm text-[12px] text-text-stone">2 hours ago</span>
                              <button
                                type="button"
                                title="Revoke this session"
                                onClick={() => alert("Desktop session revoked.")}
                                className="text-error hover:text-error/80 p-1 rounded"
                              >
                                <span className="material-symbols-outlined text-[18px] block">logout</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </main>
              </div>

              {/* Global Action Sticky Tray */}
              <div className="sticky bottom-4 z-20 bg-surface-warm/95 backdrop-blur border border-border-default rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm mt-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-text-stone text-[18px]">info</span>
                  <span className="font-body-md text-[13px] text-text-stone hidden sm:inline">Unsaved modifications are cached locally in safe buffer.</span>
                  <span className="font-body-md text-[13px] text-text-stone sm:hidden">Changes pending save.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSavingSettings(false);
                      setSavedNotice(false);
                      alert("Changes discarded.");
                    }}
                    className="px-4 py-2 border border-border-default hover:bg-surface-container text-on-surface rounded font-label-md text-label-md font-semibold transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSavingSettings(true);
                      setTimeout(() => {
                        setSavingSettings(false);
                        setSavedNotice(true);
                        setTimeout(() => setSavedNotice(false), 3000);
                      }, 800);
                    }}
                    disabled={savingSettings}
                    className={`px-6 py-2 rounded font-label-md text-label-md font-semibold transition-colors flex items-center gap-2 ${
                      savedNotice
                        ? "bg-success text-white"
                        : "bg-primary hover:bg-primary-container text-on-primary"
                    }`}
                  >
                    {savingSettings ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                        <span>Saving...</span>
                      </>
                    ) : savedNotice ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">done_all</span>
                        <span>Changes Saved</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QR SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-bright border border-border-default rounded-none max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-primary p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-4">
              <h3 className="font-display-lg text-xl font-bold text-primary">
                Mark Lecture Attendance
              </h3>
              <p className="text-xs text-text-muted">
                Scan the QR code displayed by your faculty or upload a QR image
              </p>
            </div>

            <QRScanner
              onAttendanceMarked={() => {
                fetchAttendance();
              }}
            />

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowScanner(false)}
                className="text-xs text-text-muted hover:underline"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP CENTER MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-bright border border-border-default rounded-none max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-bold text-lg text-primary mb-3">Help & Support</h3>
            <p className="text-sm text-text-stone mb-4">
              Welcome to LectureLog! To mark attendance for a class:
            </p>
            <ol className="list-decimal list-inside text-xs text-text-stone space-y-2 mb-4">
              <li>Click on <strong>Start Attendance</strong> or <strong>Mark Attendance</strong>.</li>
              <li>Allow camera access or upload the QR image provided by your professor.</li>
              <li>Once scanned, your attendance will be logged instantly in real-time.</li>
            </ol>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-primary text-on-primary py-2 rounded-none text-sm font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;