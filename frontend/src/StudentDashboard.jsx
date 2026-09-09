import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function StudentDashboard({ user: userProp, token: tokenProp, onLogout }) {
  const user = userProp || JSON.parse(localStorage.getItem("user") || "{}");
  const token = tokenProp || localStorage.getItem("token");

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
  const percentage =
    totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : "0.0";

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Student";
  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  // Dynamic Date & Time Greeting
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
      };
    }
    acc[code].total += 1;
    if (item.status === "PRESENT") acc[code].present += 1;
    return acc;
  }, {});

  const subjectList = Object.values(subjectMap);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "attendance", label: "Attendance", icon: "calendar_today" },
    { id: "courses", label: "Courses", icon: "school" },
    { id: "schedule", label: "Schedule", icon: "event_note" },
    { id: "reports", label: "Reports", icon: "bar_chart" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col md:flex-row">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar (Desktop & Mobile) */}
      <nav
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-warm border-r border-border-default py-6 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="px-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display-lg text-3xl font-bold text-primary tracking-tight">
              LectureLog
            </h1>
            <p className="font-label-sm text-xs text-text-muted mt-1 uppercase tracking-wider">
              Smart Attendance Suite
            </p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-text-muted hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-6 py-3 font-label-md text-sm transition-all duration-200 ease-in-out w-full text-left active:scale-[0.98] ${
                  isActive
                    ? "text-secondary bg-secondary/10 border-l-4 border-secondary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container"
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
        </div>

        <div className="px-4 mt-auto mb-4">
          <button
            onClick={() => {
              setShowScanner(true);
              setMobileMenuOpen(false);
            }}
            className="w-full bg-secondary text-on-secondary font-label-md text-sm py-3 px-4 rounded hover:bg-secondary-container transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
            Start Attendance
          </button>
        </div>

        <div className="flex flex-col gap-1 border-t border-border-default pt-4 px-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-3 px-4 py-2 text-text-muted hover:bg-surface-container transition-colors font-label-md text-sm rounded w-full text-left"
          >
            <span className="material-symbols-outlined text-lg">help</span>
            Help Center
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 transition-colors font-label-md text-sm rounded w-full text-left"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 w-full max-w-[1400px] mx-auto min-h-screen flex flex-col">
        {/* TopAppBar */}
        <header className="h-16 sticky top-0 z-30 bg-surface-bright border-b border-border-default flex justify-between items-center w-full px-4 md:px-8 shadow-xs">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-primary p-1 hover:bg-surface-container rounded"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <span className="font-display-lg text-xl font-bold text-primary">
              LectureLog
            </span>
          </div>

          <div className="hidden md:block flex-1">
            <span className="text-xs uppercase font-semibold text-text-muted tracking-wider">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchAttendance()}
              title="Refresh Attendance"
              className="text-text-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              title="Attendance Log"
              className="text-text-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">history_edu</span>
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-border-default">
              <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-xs">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-semibold text-primary leading-tight">
                  {user?.full_name || "Student User"}
                </span>
                <span className="text-xs text-text-stone leading-tight">
                  {user?.email || "student@institution.edu"}
                </span>
              </div>
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

        {/* Canvas Body */}
        <div className="flex-1 p-4 md:p-8 bg-background flex flex-col gap-6 max-w-6xl w-full mx-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Greeting Section */}
              <section className="flex flex-col gap-1">
                <p className="font-label-sm text-xs text-text-muted uppercase tracking-widest font-semibold">
                  {todayFormatted}
                </p>
                <h2 className="font-dm-serif text-4xl md:text-5xl text-primary leading-tight">
                  {greeting}, {firstName}.
                </h2>
              </section>

              {/* Main Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Next Lecture / Happening Now Banner */}
                  <div className="bg-surface-warm border border-border-default p-6 md:p-8 rounded-md relative overflow-hidden group shadow-xs">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                          <span className="font-label-sm text-xs text-secondary uppercase font-semibold tracking-wider">
                            Active Session
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-lg text-2xl md:text-3xl text-primary font-semibold mb-1">
                            {attendance[0]?.subject_name || "Database Systems & Networks"}
                          </h3>
                          <p className="font-body-lg text-sm md:text-base text-text-stone flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">
                                schedule
                              </span>
                              10:00 AM - 11:30 AM
                            </span>
                            <span className="text-border-default">|</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-base">
                                room
                              </span>
                              Room 204 (Hall A)
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setActiveTab("attendance")}
                          className="px-4 py-2.5 bg-primary text-on-primary font-label-md text-sm rounded hover:bg-primary-container transition-colors shadow-xs"
                        >
                          View History
                        </button>
                        <button
                          onClick={() => setShowScanner(true)}
                          className="px-4 py-2.5 bg-secondary text-on-secondary font-label-md text-sm rounded hover:bg-secondary-container transition-colors flex items-center gap-2 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-base">
                            how_to_reg
                          </span>
                          Mark Attendance
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Today's Timeline / Attendance History Preview */}
                  <div className="bg-surface-bright border border-border-default p-6 rounded-md shadow-xs">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-border-default">
                      <h4 className="font-headline-md text-xl font-semibold text-primary">
                        Recent Attendance Activity
                      </h4>
                      <button
                        onClick={() => setActiveTab("attendance")}
                        className="text-xs text-secondary hover:underline font-semibold uppercase tracking-wider"
                      >
                        View All ({totalClasses})
                      </button>
                    </div>

                    {loading ? (
                      <div className="py-8 text-center text-text-muted">
                        Loading attendance history...
                      </div>
                    ) : attendance.length === 0 ? (
                      <div className="py-8 text-center text-text-muted flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-outline-variant">
                          event_busy
                        </span>
                        <p>No attendance records found yet.</p>
                        <button
                          onClick={() => setShowScanner(true)}
                          className="mt-2 text-xs bg-secondary text-on-secondary px-3 py-1.5 rounded font-semibold"
                        >
                          Scan QR Code Now
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col ml-2">
                        {attendance.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="relative flex gap-5 pb-6 last:pb-0"
                          >
                            {/* Vertical Line */}
                            {idx !== Math.min(attendance.length, 4) - 1 && (
                              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border-default" />
                            )}
                            <div className="relative z-10 flex-shrink-0 mt-1">
                              {item.status === "PRESENT" ? (
                                <div className="w-6 h-6 rounded-full border-2 border-success bg-success/10 flex items-center justify-center text-success">
                                  <span
                                    className="material-symbols-outlined text-xs"
                                    style={{ fontVariationSettings: "'wght' 700" }}
                                  >
                                    check
                                  </span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-error bg-error/10 flex items-center justify-center text-error">
                                  <span className="material-symbols-outlined text-xs">
                                    close
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex justify-between items-start pt-0.5">
                              <div>
                                <h5 className="font-body-lg text-base font-semibold text-primary">
                                  {item.subject_name || "Course Session"}
                                </h5>
                                <p className="text-xs text-text-stone mt-0.5">
                                  Code: {item.subject_code || "N/A"} • Lecture ID: #{item.lecture_id}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-block px-2.5 py-0.5 font-label-sm text-xs rounded font-semibold ${
                                    item.status === "PRESENT"
                                      ? "bg-success/15 text-success"
                                      : "bg-error/15 text-error"
                                  }`}
                                >
                                  {item.status}
                                </span>
                                <p className="text-[11px] text-text-muted mt-1">
                                  {new Date(item.attendance_time).toLocaleDateString()}{" "}
                                  {new Date(item.attendance_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Ring Stats & Insights (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Attendance Gauge Card */}
                  <div className="bg-surface-warm border border-border-default p-6 flex flex-col items-center justify-center min-h-[300px] rounded-md shadow-xs">
                    <h4 className="font-label-sm text-xs text-text-muted uppercase tracking-wider font-semibold mb-6 self-start w-full text-center">
                      Semester Attendance Rate
                    </h4>

                    {/* Circular Radial Gauge */}
                    <div className="relative w-44 h-44 flex items-center justify-center rounded-full bg-surface-bright border-[8px] border-surface-container">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="88"
                          cy="88"
                          r="76"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-secondary"
                          fill="transparent"
                          strokeDasharray={477}
                          strokeDashoffset={477 - (477 * Math.min(Number(percentage), 100)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex flex-col items-center z-10">
                        <span className="font-display-lg text-4xl text-primary font-bold">
                          {percentage}<span className="text-xl">%</span>
                        </span>
                        <span className="font-label-sm text-xs text-text-stone mt-1">
                          Overall Score
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 w-full flex justify-between px-6 text-center border-t border-border-default pt-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-label-sm text-xs text-text-muted">
                          Attended
                        </span>
                        <span className="font-body-lg text-lg font-bold text-success">
                          {presentClasses}
                        </span>
                      </div>
                      <div className="w-[1px] bg-border-default h-8 self-center" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-label-sm text-xs text-text-muted">
                          Total
                        </span>
                        <span className="font-body-lg text-lg font-bold text-primary">
                          {totalClasses}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Insight Alert */}
                  <div
                    className={`p-5 border rounded-md flex gap-4 items-start ${
                      Number(percentage) < 75 && totalClasses > 0
                        ? "bg-warning/10 border-warning/40"
                        : "bg-surface-container-low border-border-default"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined mt-0.5 ${
                        Number(percentage) < 75 && totalClasses > 0
                          ? "text-warning"
                          : "text-info"
                      }`}
                    >
                      {Number(percentage) < 75 && totalClasses > 0
                        ? "warning"
                        : "check_circle"}
                    </span>
                    <div>
                      <p className="font-label-md text-sm text-on-surface-variant font-semibold">
                        {Number(percentage) < 75 && totalClasses > 0
                          ? "Attendance Threshold Warning"
                          : "Attendance Health Good"}
                      </p>
                      <p className="font-body-md text-xs text-text-stone mt-1 leading-relaxed">
                        {Number(percentage) < 75 && totalClasses > 0
                          ? "Your overall attendance is currently below the 75% requirement. Make sure to attend your upcoming lectures."
                          : "You are comfortably above the minimum 75% attendance criteria. Maintain this steady rate to stay eligible for exams."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ATTENDANCE HISTORY */}
          {activeTab === "attendance" && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-dm-serif text-3xl text-primary">
                    Detailed Attendance Log
                  </h2>
                  <p className="text-xs text-text-muted">
                    Comprehensive breakdown of all recorded lectures
                  </p>
                </div>
                <button
                  onClick={() => setShowScanner(true)}
                  className="bg-secondary text-on-secondary px-4 py-2 rounded text-sm font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  Scan QR
                </button>
              </div>

              <div className="bg-surface-bright border border-border-default rounded-md overflow-hidden shadow-xs">
                {attendance.length === 0 ? (
                  <div className="p-12 text-center text-text-muted">
                    No attendance records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-warm border-b border-border-default text-xs uppercase text-text-muted font-semibold">
                        <tr>
                          <th className="py-3.5 px-6">Subject Code</th>
                          <th className="py-3.5 px-6">Subject Name</th>
                          <th className="py-3.5 px-6">Lecture ID</th>
                          <th className="py-3.5 px-6">Date & Time</th>
                          <th className="py-3.5 px-6 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {attendance.map((item) => (
                          <tr key={item.id} className="hover:bg-surface-container/50">
                            <td className="py-3.5 px-6 font-semibold text-primary">
                              {item.subject_code || "GEN101"}
                            </td>
                            <td className="py-3.5 px-6">
                              {item.subject_name || "General Session"}
                            </td>
                            <td className="py-3.5 px-6 text-text-stone">
                              #{item.lecture_id}
                            </td>
                            <td className="py-3.5 px-6 text-text-stone">
                              {new Date(item.attendance_time).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <span
                                className={`inline-block px-2.5 py-1 text-xs rounded font-semibold ${
                                  item.status === "PRESENT"
                                    ? "bg-success/15 text-success"
                                    : "bg-error/15 text-error"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

          {/* TAB 4: SCHEDULE */}
          {activeTab === "schedule" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-dm-serif text-3xl text-primary">Academic Timetable</h2>
                <p className="text-xs text-text-muted">
                  Weekly class schedule & lecture timing
                </p>
              </div>

              <div className="bg-surface-bright border border-border-default p-6 rounded-md shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day, i) => (
                      <div
                        key={day}
                        className={`p-4 border rounded ${
                          i === 3
                            ? "border-secondary bg-secondary/5"
                            : "border-border-default bg-surface-warm"
                        }`}
                      >
                        <h5 className="font-bold text-primary mb-3 pb-2 border-b border-border-default flex justify-between items-center">
                          {day}
                          {i === 3 && (
                            <span className="text-[10px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded font-semibold">
                              Today
                            </span>
                          )}
                        </h5>
                        <div className="flex flex-col gap-3 text-xs">
                          <div className="p-2 bg-surface border border-border-default rounded">
                            <p className="font-semibold text-primary">Mathematics</p>
                            <p className="text-text-stone">08:30 - 09:30 AM</p>
                          </div>
                          <div className="p-2 bg-surface border border-border-default rounded">
                            <p className="font-semibold text-primary">
                              Database Systems
                            </p>
                            <p className="text-text-stone">10:00 - 11:30 AM</p>
                          </div>
                          <div className="p-2 bg-surface border border-border-default rounded">
                            <p className="font-semibold text-primary">
                              Operating Systems
                            </p>
                            <p className="text-text-stone">01:00 - 02:30 PM</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS */}
          {activeTab === "reports" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-dm-serif text-3xl text-primary">
                  Attendance Reports
                </h2>
                <p className="text-xs text-text-muted">
                  Exportable analytics and attendance metrics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-bright border border-border-default p-6 rounded-md">
                  <span className="material-symbols-outlined text-secondary text-3xl mb-2">
                    verified
                  </span>
                  <h4 className="text-2xl font-bold text-primary">{percentage}%</h4>
                  <p className="text-xs text-text-muted mt-1">Average Attendance</p>
                </div>
                <div className="bg-surface-bright border border-border-default p-6 rounded-md">
                  <span className="material-symbols-outlined text-success text-3xl mb-2">
                    check_circle
                  </span>
                  <h4 className="text-2xl font-bold text-primary">{presentClasses}</h4>
                  <p className="text-xs text-text-muted mt-1">Total Classes Attended</p>
                </div>
                <div className="bg-surface-bright border border-border-default p-6 rounded-md">
                  <span className="material-symbols-outlined text-primary text-3xl mb-2">
                    event_repeat
                  </span>
                  <h4 className="text-2xl font-bold text-primary">{totalClasses}</h4>
                  <p className="text-xs text-text-muted mt-1">Total Lectures Recorded</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-dm-serif text-3xl text-primary">Student Account</h2>
                <p className="text-xs text-text-muted">
                  Personal information & system preferences
                </p>
              </div>

              <div className="bg-surface-bright border border-border-default p-6 rounded-md max-w-xl flex flex-col gap-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border-default">
                  <div className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-2xl">
                    {userInitials}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary">
                      {user?.full_name || "Student Name"}
                    </h3>
                    <p className="text-xs text-text-stone">
                      Role: {user?.role ? user.role.toUpperCase() : "STUDENT"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-text-muted">
                      Full Name
                    </label>
                    <p className="font-semibold text-primary">
                      {user?.full_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted">
                      Email Address
                    </label>
                    <p className="font-semibold text-primary">
                      {user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted">
                      User ID
                    </label>
                    <p className="font-semibold text-primary">#{user?.id || "N/A"}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="mt-4 bg-error text-on-error py-2.5 rounded font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QR SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-bright border border-border-default rounded-lg max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
          <div className="bg-surface-bright border border-border-default rounded-lg max-w-md w-full p-6 shadow-2xl relative">
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
              className="w-full bg-primary text-on-primary py-2 rounded text-sm font-semibold"
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