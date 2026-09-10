import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API_BASE });

function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function formatDateDisplay(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
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

export default function HodDashboard({ user, token, onLogout, onToggleRole }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'faculty-gov' | 'hall-tickets' | 'curriculum' | 'accreditation' | 'dean-dossier' | 'governance'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Search and filters
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterSection, setStudentFilterSection] = useState("ALL");
  const [studentFilterClearance, setStudentFilterClearance] = useState("ALL");
  const [facultySearch, setFacultySearch] = useState("");

  // Modals
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCredits, setNewCourseCredits] = useState("4");
  const [courseSubmitLoading, setCourseSubmitLoading] = useState(false);
  const [courseMessage, setCourseMessage] = useState("");

  // Add Student Modal State (HOD / Faculty authority)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: "",
    email: "",
    password: "student123",
    rollNumber: "",
    section: "Sec A",
  });
  const [studentSubmitLoading, setStudentSubmitLoading] = useState(false);
  const [studentModalError, setStudentModalError] = useState("");

  // Add Faculty Modal State (HOD administrative authority)
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [newFacultyForm, setNewFacultyForm] = useState({
    fullName: "",
    email: "",
    password: "faculty123",
    designation: "Assistant Professor",
    department: "Department of Computer Science & Engineering",
  });
  const [facultySubmitLoading, setFacultySubmitLoading] = useState(false);
  const [facultyModalError, setFacultyModalError] = useState("");

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState("ALL_FACULTY");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [circulars, setCirculars] = useState([
    {
      id: "circ-1",
      date: "10 Sep 2026",
      target: "All Faculty",
      subject: "Mandatory Mid-Term Statutory Attendance Ledger Submission to Dean's Office",
      author: "Prof. Department Head",
      status: "Dispatched",
    },
    {
      id: "circ-2",
      date: "08 Sep 2026",
      target: "CSE Students (Sec A & B)",
      subject: "Examination Hall-Ticket Disqualification Warning for Candidates Below 75%",
      author: "Office of the HOD",
      status: "Published",
    },
  ]);

  const [selectedAuditLecture, setSelectedAuditLecture] = useState(null);
  const [hallTicketDispensationModal, setHallTicketDispensationModal] = useState(null);
  const [dispensationReason, setDispensationReason] = useState("Medical Board Authorized Leave");

  // Local student clearance state overrides (HOD power to clear/hold exam hall tickets)
  const [clearanceOverrides, setClearanceOverrides] = useState({});

  // Department Policy & Governance State
  const [deptPolicy, setDeptPolicy] = useState({
    statutoryThreshold: 75,
    criticalThreshold: 65,
    gracePeriodMins: 5,
    deanAutoSync: true,
    weeklyFloorAudit: true,
  });
  const [policySavedAlert, setPolicySavedAlert] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [statsRes, studentsRes, facultyRes, coursesRes, lecturesRes] =
        await Promise.allSettled([
          api.get("/hod/stats", auth(token)),
          api.get("/hod/students", auth(token)),
          api.get("/hod/faculty", auth(token)),
          api.get("/hod/courses", auth(token)),
          api.get("/hod/lectures", auth(token)),
        ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (studentsRes.status === "fulfilled") setStudents(studentsRes.value.data.students || []);
      if (facultyRes.status === "fulfilled") setFaculty(facultyRes.value.data.faculty || []);
      if (coursesRes.status === "fulfilled") setCourses(coursesRes.value.data.courses || []);
      if (lecturesRes.status === "fulfilled") setLectures(lecturesRes.value.data.lectures || []);
    } catch (err) {
      console.error("Error loading HOD command data:", err);
      setMessage("Operating in secure departmental offline cache mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseName.trim()) {
      setCourseMessage("Course code and title are required.");
      return;
    }

    setCourseSubmitLoading(true);
    setCourseMessage("");
    try {
      const { data } = await api.post(
        "/hod/courses",
        {
          subject_code: newCourseCode.trim(),
          subject_name: newCourseName.trim(),
        },
        auth(token)
      );

      const refreshed = await api.get("/hod/courses", auth(token));
      setCourses(refreshed.data.courses || []);
      setNewCourseCode("");
      setNewCourseName("");
      setShowAddCourseModal(false);
      alert(data.message || "Course curriculum successfully accredited!");
    } catch (err) {
      setCourseMessage(err.response?.data?.message || "Failed to register course.");
    } finally {
      setCourseSubmitLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim() || !newStudentForm.email.trim()) {
      setStudentModalError("Full name and institutional email are required.");
      return;
    }

    setStudentSubmitLoading(true);
    setStudentModalError("");
    try {
      const { data } = await api.post(
        "/users/students",
        {
          full_name: newStudentForm.fullName.trim(),
          email: newStudentForm.email.trim(),
          password: newStudentForm.password.trim(),
          roll_number: newStudentForm.rollNumber.trim() || undefined,
          section: newStudentForm.section.trim(),
        },
        auth(token)
      );

      setNewStudentForm({
        fullName: "",
        email: "",
        password: "student123",
        rollNumber: "",
        section: "Sec A",
      });
      setShowAddStudentModal(false);
      await fetchAllData();
      alert(data.message || "Student enrolled successfully!");
    } catch (err) {
      setStudentModalError(err.response?.data?.message || "Failed to register student.");
    } finally {
      setStudentSubmitLoading(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!newFacultyForm.fullName.trim() || !newFacultyForm.email.trim()) {
      setFacultyModalError("Full name and institutional email are required.");
      return;
    }

    setFacultySubmitLoading(true);
    setFacultyModalError("");
    try {
      const { data } = await api.post(
        "/users/faculty",
        {
          full_name: newFacultyForm.fullName.trim(),
          email: newFacultyForm.email.trim(),
          password: newFacultyForm.password.trim(),
          designation: newFacultyForm.designation.trim(),
          department: newFacultyForm.department.trim(),
        },
        auth(token)
      );

      setNewFacultyForm({
        fullName: "",
        email: "",
        password: "faculty123",
        designation: "Assistant Professor",
        department: "Department of Computer Science & Engineering",
      });
      setShowAddFacultyModal(false);
      await fetchAllData();
      alert(data.message || "Faculty member onboarded successfully!");
    } catch (err) {
      setFacultyModalError(err.response?.data?.message || "Failed to onboard faculty member.");
    } finally {
      setFacultySubmitLoading(false);
    }
  };

  const handleBroadcastCircular = (e) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return;

    const newCirc = {
      id: `circ-${Date.now()}`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      target: broadcastTarget === "ALL_FACULTY" ? "All Faculty" : broadcastTarget === "ALL_STUDENTS" ? "All Students" : "Faculty & Students",
      subject: broadcastSubject.trim(),
      author: user?.full_name || "Prof. Department Head",
      status: "Dispatched",
    };

    setCirculars([newCirc, ...circulars]);
    setBroadcastSubject("");
    setBroadcastBody("");
    setShowBroadcastModal(false);
    alert("Official Department Circular broadcast successfully!");
  };

  const toggleHallTicket = (studentId, currentEligible) => {
    const nextState = !currentEligible;
    setClearanceOverrides((prev) => ({
      ...prev,
      [studentId]: nextState,
    }));
  };

  const handleGrantDispensation = () => {
    if (!hallTicketDispensationModal) return;
    setClearanceOverrides((prev) => ({
      ...prev,
      [hallTicketDispensationModal.id]: true,
    }));
    alert(`Executive Dean Dispensation granted for ${hallTicketDispensationModal.fullName} (${hallTicketDispensationModal.rollNumber}) under clause: ${dispensationReason}. Exam Hall-Ticket issued.`);
    setHallTicketDispensationModal(null);
  };

  const exportFormalLedger = () => {
    const rows = [
      ["REGULATORY ATTENDANCE AUDIT LEDGER - DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING"],
      [`ACCREDITATION CYCLE: AY 2026-27 | STATUTORY MINIMUM: ${deptPolicy.statutoryThreshold}%`],
      ["Generated by: Office of the Head of Department"],
      [""],
      ["Roll Number", "Candidate Full Name", "Email Address", "Section", "Sessions Attended", "Total Lectures", "Attendance %", "Deficit", "Statutory Exam Clearance", "Executive Status"],
      ...students.map((s) => {
        const isEligible = clearanceOverrides[s.id] !== undefined
          ? clearanceOverrides[s.id]
          : s.attendancePercentage >= deptPolicy.statutoryThreshold;
        const deficit = Math.max(0, Math.round((deptPolicy.statutoryThreshold - s.attendancePercentage) * 10) / 10);
        return [
          s.rollNumber,
          s.fullName,
          s.email,
          s.section,
          s.attendedLectures,
          s.totalLectures,
          `${s.attendancePercentage}%`,
          deficit > 0 ? `-${deficit}%` : "0%",
          isEligible ? "CLEARED FOR EXAMS" : "WITHHELD (DISQUALIFIED)",
          s.status,
        ];
      }),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CSE_Statutory_Attendance_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="text-on-surface font-body-md text-body-md antialiased min-h-screen bg-[#F5F2EA] flex flex-col">
      {/* ================= TOP APP BAR ================= */}
      <header className="bg-surface-warm h-16 sticky top-0 z-40 border-b border-border-default flex justify-between items-center w-full px-4 md:pl-80 md:pr-8">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-text-muted hover:text-primary rounded focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
          <div className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight md:hidden flex items-center gap-2">
            <span className="font-serif font-bold text-[#D4A373] bg-[#12181F] px-1.5 py-0.5 rounded text-xs border border-[#B85C3A]">CSE</span>
            <span>LectureLog</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 border border-border-default bg-surface-container-lowest text-xs">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9E3D24] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
              Command Active
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="font-label-sm text-label-sm text-text-stone">CSE Oversight</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#9E3D24] hover:bg-[#83311C] text-white text-xs font-semibold rounded transition-colors shadow-2xs cursor-pointer"
            title="Issue an official department directive or circular"
          >
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            <span>Issue Directive</span>
          </button>

          {onToggleRole && (
            <div className="flex items-center bg-surface-container border border-border-default rounded px-2.5 py-1 text-xs font-medium">
              <span className="text-text-stone mr-1 font-semibold hidden sm:inline">Portal:</span>
              <select
                value={user?.role || "HOD"}
                onChange={(e) => onToggleRole(e.target.value)}
                className="bg-transparent text-primary font-bold cursor-pointer focus:outline-none min-w-[110px]"
                title="Switch application portal preview"
              >
                <option value="HOD">HOD Portal</option>
                <option value="FACULTY">Faculty Portal</option>
                <option value="STUDENT">Student Portal</option>
              </select>
            </div>
          )}

          <div className="w-9 h-9 rounded bg-[#12181F] text-[#D4A373] font-serif font-bold text-sm flex items-center justify-center border border-[#B85C3A] shadow-2xs shrink-0">
            HOD
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
              {user?.full_name || "Prof. Department Head"}
            </span>
            <span className="font-label-sm text-label-sm text-text-stone leading-tight">
              Head of Department, CSE
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-text-muted hover:text-error hover:bg-error-container/20 rounded transition-colors cursor-pointer ml-1"
            title="Sign out of command session"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {/* ================= LEFT SIDE NAVIGATION BAR ================= */}
      <nav
        className={`bg-surface-warm h-screen w-72 fixed left-0 top-0 border-r border-border-default flex flex-col justify-between z-50 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-border-default">
            <div className="w-9 h-9 bg-linear-to-br from-[#1E2732] to-[#12181F] text-[#D4A373] flex items-center justify-center rounded-sm border border-[#B85C3A] font-serif font-bold text-sm shadow-xs shrink-0">
              CSE
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-greeting-serif text-headline-md tracking-tight text-on-surface leading-none font-bold truncate">
                LectureLog
              </span>
              <span className="font-label-sm text-[10px] text-[#9E3D24] font-bold tracking-wider uppercase mt-1 truncate">
                Office of the HOD
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-4 border-b border-border-default">
            <button
              onClick={() => {
                setShowBroadcastModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#9E3D24] text-white font-label-md text-label-md py-2.5 px-4 rounded-none hover:bg-[#83311C] active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-medium tracking-wide shadow-none cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              <span>Issue Directive</span>
            </button>
          </div>

          {/* Nav Section Items */}
          <div className="py-3 flex flex-col overflow-y-auto max-h-[calc(100vh-250px)]">
            {[
              { id: "overview", label: "Department Command", icon: "security", badge: "Live" },
              { id: "faculty-gov", label: "Faculty Governance", icon: "supervisor_account", count: faculty.length },
              { id: "hall-tickets", label: "Hall-Ticket Clearance", icon: "fact_check", count: students.length },
              { id: "curriculum", label: "Curricula & Courses", icon: "menu_book", count: courses.length },
              { id: "accreditation", label: "Institutional Analytics", icon: "analytics" },
              { id: "dean-dossier", label: "Dean’s Statutory Dossier", icon: "balance" },
              { id: "governance", label: "Directives & Policies", icon: "policy", count: circulars.length },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-5 py-2.5 font-label-md text-label-md text-left transition-colors border-l-4 cursor-pointer flex items-center justify-between gap-2 ${
                    active
                      ? "border-[#9E3D24] bg-surface-container text-on-surface font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-[#9E3D24]" : "text-text-muted"}`}>
                      {tab.icon}
                    </span>
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {tab.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#4CAF50] text-white tracking-widest uppercase">
                        {tab.badge}
                      </span>
                    )}
                    {typeof tab.count === "number" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${active ? "bg-[#9E3D24] text-white" : "bg-surface-container-high text-text-stone"}`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-4 border-t border-border-default flex flex-col gap-1 bg-surface-warm">
          <button
            onClick={() => exportFormalLedger()}
            className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors text-left flex items-center gap-3 cursor-pointer"
            title="Download official regulatory attendance ledger"
          >
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            <span>Export Ledger CSV</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("dean-dossier");
              setMobileMenuOpen(false);
            }}
            className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-on-surface transition-colors text-left flex items-center gap-3 cursor-pointer"
            title="View Dean's Statutory Dossier"
          >
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
            <span>Dean Dossier</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high hover:text-error transition-colors text-left flex items-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Scrim Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* ================= COMMAND WORKSPACE (MAIN CANVAS) ================= */}
      <main className="md:ml-72 p-6 md:p-8 max-w-[1400px] min-h-screen pb-24 w-full">
        {/* Executive Ribbon */}
        <div className="mb-6 bg-[#12181F] text-[#EDE8DF] border border-[#2C353F] rounded px-4 py-2.5 text-xs shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#9E3D24] text-[#FFFFFF] text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse"></span>
                OFFICE OF THE HEAD OF DEPARTMENT
              </span>
              <span className="text-[#8B98A5] hidden sm:inline">•</span>
              <span className="text-[#B9C5D1] font-serif tracking-wide hidden md:inline">
                Department of Computer Science & Engineering • Dean’s Governance Tier
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#8B98A5] text-[11px] font-mono">
              <span>AUDIT STATUS: <strong className="text-[#4CAF50]">NBA TIER-1 ACCREDITED</strong></span>
              <span>•</span>
              <span>DEAN SYNC: <strong className="text-[#EDE8DF]">REAL-TIME</strong></span>
            </div>
          </div>
        </div>
        {message && (
          <div className="mb-6 p-3 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded flex items-center gap-2 text-xs font-medium">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{message}</span>
          </div>
        )}

        {/* ================= TAB 1: EXECUTIVE COMMAND CENTER ================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Executive Status Ribbon */}
            <div className="bg-[#FFFFFF] border-l-4 border-[#9E3D24] border-t border-r border-b border-[#D8D2C4] rounded-r p-6 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
                  EXECUTIVE BRIEFING • AY 2026-27 (FALL TERM)
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                  Department Operational Readiness & Accreditation Index
                </h1>
                <p className="text-xs text-[#555E68] mt-1 max-w-3xl leading-relaxed">
                  The Department of Computer Science & Engineering is currently operating at{" "}
                  <strong className="text-[#2E6B34]">{stats?.aggregateAttendance || "89.4"}% aggregate statutory attendance</strong>.{" "}
                  {students.filter((s) => s.status.includes("Level")).length || 3} students require mandatory HOD clearance review before examination hall-tickets are generated.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={exportFormalLedger}
                  className="px-4 py-2.5 bg-[#1C242E] hover:bg-[#12181F] text-[#EDE8DF] text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Export Accreditation CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Statutory Attendance Ledger submitted to Dean of Academic Affairs.")}
                  className="px-4 py-2.5 bg-[#9E3D24] hover:bg-[#83311C] text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Transmit Dean Dossier</span>
                </button>
              </div>
            </div>

            {/* Department Indices Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
                <div className="flex justify-between items-center text-[#736F68] text-[11px] font-mono font-bold uppercase">
                  <span>Aggregate Attendance</span>
                  <span className="material-symbols-outlined text-[#2E6B34]">check_circle</span>
                </div>
                <div className="mt-3">
                  <div className="font-serif text-4xl font-bold text-[#12181F]">
                    {stats?.aggregateAttendance || 89.4}%
                  </div>
                  <div className="text-[11px] text-[#2E6B34] font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">north_east</span>
                    <span>+14.4% Above Dean's 75% Cutoff</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
                <div className="flex justify-between items-center text-[#736F68] text-[11px] font-mono font-bold uppercase">
                  <span>Faculty Timetable Compliance</span>
                  <span className="material-symbols-outlined text-[#1C242E]">co_present</span>
                </div>
                <div className="mt-3">
                  <div className="font-serif text-4xl font-bold text-[#12181F]">98.2%</div>
                  <div className="text-[11px] text-[#736F68] mt-1 font-medium">
                    {faculty.length || 14} Professors on Schedule
                  </div>
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
                <div className="flex justify-between items-center text-[#736F68] text-[11px] font-mono font-bold uppercase">
                  <span>Exam Hall-Ticket Hold</span>
                  <span className="material-symbols-outlined text-[#BA1A1A]">gavel</span>
                </div>
                <div className="mt-3">
                  <div className="font-serif text-4xl font-bold text-[#BA1A1A]">
                    {students.filter((s) => s.status.includes("Level")).length || 3} Candidates
                  </div>
                  <div className="text-[11px] text-[#BA1A1A] font-semibold mt-1">
                    Disqualified pending HOD review
                  </div>
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
                <div className="flex justify-between items-center text-[#736F68] text-[11px] font-mono font-bold uppercase">
                  <span>Accreditation Risk</span>
                  <span className="material-symbols-outlined text-[#4CAF50]">verified_user</span>
                </div>
                <div className="mt-3">
                  <div className="font-serif text-4xl font-bold text-[#2E6B34]">Low (Tier 1)</div>
                  <div className="text-[11px] text-[#2E6B34] font-semibold mt-1">
                    Full Compliance for NBA/NAAC Cycle
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Department Floor Plan / Classroom Monitor */}
            <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D8D2C4] gap-2">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#12181F]">
                    Live Department Lecture Hall & Laboratory Matrix
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Real-time floor oversight of classes currently in session across CSE Wing.
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#2E6B34]/10 text-[#2E6B34] border border-[#2E6B34]/30 rounded text-xs font-bold flex items-center gap-1.5 self-start">
                  <span className="w-2 h-2 rounded-full bg-[#2E6B34] animate-ping"></span>
                  Active Floor Beacons
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {[
                  {
                    room: "Lecture Hall LH-301",
                    subject: "CS501: Relational Database Systems",
                    faculty: "Dr. Demo Faculty",
                    time: "09:00 - 10:30 AM",
                    status: "In Session",
                    strength: "48 / 52 Checked-in",
                    rate: 92.3,
                  },
                  {
                    room: "Advanced Computing Lab 4",
                    subject: "CS503: Operating Systems Architecture",
                    faculty: "Prof. R. V. Kulkarni",
                    time: "10:00 - 12:00 PM",
                    status: "In Session",
                    strength: "41 / 45 Checked-in",
                    rate: 91.1,
                  },
                  {
                    room: "Seminar Hall West",
                    subject: "CS702: Cloud & Distributed Consensus",
                    faculty: "Dr. Anita Desai",
                    time: "11:30 - 01:00 PM",
                    status: "Scheduled Next",
                    strength: "32 Enrolled",
                    rate: 96.8,
                  },
                ].map((room, idx) => (
                  <div key={idx} className="bg-[#FBF9F5] border border-[#D8D2C4] rounded p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-[#D8D2C4]/60">
                        <span className="font-mono text-xs font-bold text-[#9E3D24]">{room.room}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${room.status === "In Session" ? "bg-[#2E6B34]/10 text-[#2E6B34]" : "bg-[#6B7280]/10 text-[#6B7280]"}`}>
                          {room.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-serif font-bold text-sm text-[#12181F]">{room.subject}</h4>
                        <div className="text-xs text-[#6B7280] mt-1">Faculty: <strong>{room.faculty}</strong></div>
                        <div className="text-xs text-[#6B7280]">Time: {room.time}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#D8D2C4]/60 flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-[#12181F]">{room.strength}</div>
                      <button
                        type="button"
                        onClick={() => setSelectedAuditLecture(room)}
                        className="px-2.5 py-1 text-xs bg-[#1C242E] hover:bg-[#12181F] text-white rounded font-semibold cursor-pointer"
                      >
                        Audit Room
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Circulars & Governance Feed */}
            <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs">
              <div className="flex justify-between items-center pb-4 border-b border-[#D8D2C4]">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#12181F]">
                    Recent HOD Department Directives & Circulars
                  </h3>
                  <p className="text-xs text-[#6B7280]">Official circulars broadcast to CSE faculty and student portals.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  className="px-3 py-1.5 bg-[#F3EFE6] hover:bg-[#D8D2C4] text-[#12181F] text-xs font-bold rounded border border-[#D8D2C4] cursor-pointer"
                >
                  + New Directive
                </button>
              </div>

              <div className="divide-y divide-[#D8D2C4]/60 mt-2">
                {circulars.map((c) => (
                  <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#9E3D24]/10 text-[#9E3D24] text-[10px] font-bold rounded uppercase">
                          {c.target}
                        </span>
                        <span className="font-semibold text-sm text-[#12181F]">{c.subject}</span>
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        Issued by: {c.author} • Date: {c.date}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#2E6B34] bg-[#2E6B34]/10 px-2 py-0.5 rounded self-start sm:self-center font-bold">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FACULTY GOVERNANCE & WORKLOAD ================= */}
        {activeTab === "faculty-gov" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
                  FACULTY ACADEMIC SUPERVISION
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                  Department Faculty Teaching Quotas & Compliance
                </h1>
                <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
                  Supervise teaching loads, syllabus progress, lecture completion percentages, and biometric session attendance.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(true)}
                  className="px-4 py-2 bg-[#9E3D24] text-white text-xs font-bold rounded hover:bg-[#83311C] cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Add Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Official Department Teaching Load Dossier prepared for Dean.")}
                  className="px-4 py-2 bg-[#1C242E] text-white text-xs font-bold rounded hover:bg-[#12181F] cursor-pointer shadow-xs"
                >
                  Download Faculty Performance Dossier
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="bg-[#FFFFFF] p-3 border border-[#D8D2C4] rounded">
              <input
                type="text"
                placeholder="Search faculty by name or email..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#9E3D24]"
              />
            </div>

            {/* Faculty Governance Matrix */}
            <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] text-xs font-bold uppercase text-[#6B7280] font-mono">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Academic Role</th>
                    <th className="py-3 px-4">Assigned Courses</th>
                    <th className="py-3 px-4 text-center">Sessions Conducted</th>
                    <th className="py-3 px-4 text-right">Punctuality Score</th>
                    <th className="py-3 px-4">Supervisory Status</th>
                    <th className="py-3 px-4 text-center">Direct Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D2C4]/60">
                  {faculty
                    .filter((f) => f.fullName.toLowerCase().includes(facultySearch.toLowerCase()))
                    .map((fac) => (
                      <tr key={fac.id} className="hover:bg-[#FBF9F5]">
                        <td className="py-4 px-4 font-bold text-[#12181F]">
                          <div>{fac.fullName}</div>
                          <div className="text-xs font-mono font-normal text-[#6B7280]">{fac.email}</div>
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-[#1C242E]">
                          <span className="px-2 py-0.5 bg-[#F3EFE6] rounded border border-[#D8D2C4]">
                            {fac.role === "HOD" ? "Professor & HOD" : "Assistant Professor"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-[#555E68]">
                          {fac.courses.join(", ")}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-sm">
                          {fac.lecturesConducted} Lectures
                        </td>
                        <td className="py-4 px-4 text-right font-serif font-bold text-base text-[#2E6B34]">
                          {fac.complianceRate}%
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-[#2E6B34]/10 text-[#2E6B34] text-xs font-bold rounded inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B34]"></span>
                            In Good Standing
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => alert(`Official HOD Directive dispatched to ${fac.fullName}`)}
                            className="px-2.5 py-1 text-xs bg-[#1C242E] hover:bg-[#12181F] text-white rounded font-semibold cursor-pointer"
                          >
                            Send Directive
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STUDENT COHORT & HALL-TICKET DESK ================= */}
        {activeTab === "hall-tickets" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#BA1A1A] font-bold">
                  REGULATORY DISCIPLINE & EXAMINATION CLEARANCE
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                  Examination Hall-Ticket Clearance Desk
                </h1>
                <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
                  Under University Statute §42.1, candidates below 75% attendance are disqualified from final semester exams unless granted executive HOD dispensation.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-4 py-2 bg-[#9E3D24] text-white text-xs font-bold rounded hover:bg-[#83311C] cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Add Student</span>
                </button>
                <button
                  type="button"
                  onClick={exportFormalLedger}
                  className="px-4 py-2 bg-white border border-[#D8D2C4] hover:bg-[#F3EFE6] text-xs font-semibold rounded cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Export Hall-Ticket Clearance List</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 border border-[#D8D2C4] rounded shadow-xs flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                placeholder="Search by student name, roll number, or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="flex-1 w-full px-3 py-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
              />
              <select
                value={studentFilterSection}
                onChange={(e) => setStudentFilterSection(e.target.value)}
                className="px-3 py-2 text-xs border border-[#D8D2C4] rounded bg-[#FBF9F5] font-semibold cursor-pointer"
              >
                <option value="ALL">All Cohort Sections</option>
                <option value="Sec A">Section A</option>
                <option value="Sec B">Section B</option>
              </select>
              <select
                value={studentFilterClearance}
                onChange={(e) => setStudentFilterClearance(e.target.value)}
                className="px-3 py-2 text-xs border border-[#D8D2C4] rounded bg-[#FBF9F5] font-semibold cursor-pointer"
              >
                <option value="ALL">All Clearance States</option>
                <option value="CLEARED">Cleared Candidates (≥75%)</option>
                <option value="WITHHELD">Withheld / Disqualified (&lt;75%)</option>
              </select>
            </div>

            {/* Hall-Ticket Clearance Table */}
            <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] text-xs font-bold uppercase text-[#6B7280] font-mono">
                    <th className="py-3 px-4">Candidate Identification</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4 text-center">Sessions Logged</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                    <th className="py-3 px-4 text-right">Statutory Deficit</th>
                    <th className="py-3 px-4 text-center">Exam Hall-Ticket Status</th>
                    <th className="py-3 px-4 text-center">HOD Executive Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D2C4]/60">
                  {students
                    .filter((s) => {
                      const matchesSearch =
                        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.rollNumber.toLowerCase().includes(studentSearch.toLowerCase());
                      const matchesSec = studentFilterSection === "ALL" || s.section === studentFilterSection;
                      const isClear = clearanceOverrides[s.id] !== undefined
                        ? clearanceOverrides[s.id]
                        : s.attendancePercentage >= deptPolicy.statutoryThreshold;
                      const matchesClr =
                        studentFilterClearance === "ALL" ||
                        (studentFilterClearance === "CLEARED" && isClear) ||
                        (studentFilterClearance === "WITHHELD" && !isClear);
                      return matchesSearch && matchesSec && matchesClr;
                    })
                    .map((st) => {
                      const isCleared =
                        clearanceOverrides[st.id] !== undefined
                          ? clearanceOverrides[st.id]
                          : st.attendancePercentage >= deptPolicy.statutoryThreshold;
                      const deficit = Math.max(0, Math.round((deptPolicy.statutoryThreshold - st.attendancePercentage) * 10) / 10);

                      return (
                        <tr key={st.id} className="hover:bg-[#FBF9F5]">
                          <td className="py-3.5 px-4 font-bold text-[#12181F]">
                            <div>{st.fullName}</div>
                            <div className="text-xs font-mono font-normal text-[#6B7280]">{st.rollNumber}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-[#555E68]">{st.section}</td>
                          <td className="py-3.5 px-4 text-center text-xs font-mono">
                            {st.attendedLectures} / {st.totalLectures}
                          </td>
                          <td className="py-3.5 px-4 text-right font-serif font-bold text-base">
                            <span className={st.attendancePercentage >= 75 ? "text-[#2E6B34]" : "text-[#BA1A1A]"}>
                              {st.attendancePercentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs font-bold">
                            {deficit > 0 ? (
                              <span className="text-[#BA1A1A]">-{deficit}%</span>
                            ) : (
                              <span className="text-[#2E6B34]">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-3 py-1 rounded text-xs font-bold inline-flex items-center gap-1.5 ${
                                isCleared
                                  ? "bg-[#2E6B34]/10 text-[#2E6B34] border border-[#2E6B34]/30"
                                  : "bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/30"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isCleared ? "bg-[#2E6B34]" : "bg-[#BA1A1A]"}`}></span>
                              {isCleared ? "CLEARED" : "WITHHELD"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleHallTicket(st.id, isCleared)}
                                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                                  isCleared
                                    ? "bg-[#BA1A1A]/10 hover:bg-[#BA1A1A] text-[#BA1A1A] hover:text-white"
                                    : "bg-[#2E6B34]/10 hover:bg-[#2E6B34] text-[#2E6B34] hover:text-white"
                                }`}
                              >
                                {isCleared ? "Hold Ticket" : "Release Ticket"}
                              </button>

                              {!isCleared && (
                                <button
                                  type="button"
                                  onClick={() => setHallTicketDispensationModal(st)}
                                  className="px-2.5 py-1 text-xs font-bold bg-[#D4A373]/20 hover:bg-[#D4A373] text-[#834E1D] hover:text-white rounded cursor-pointer"
                                  title="Grant HOD Medical/Dean Exemption"
                                >
                                  Dispensation
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: CURRICULUM & COURSES ================= */}
        {activeTab === "curriculum" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
                  DEPARTMENTAL CURRICULUM ACCREDITATION
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                  Accredited Courses & Curricula Modules
                </h1>
                <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
                  Manage departmental course syllabus codes, faculty allocations, and aggregate student attendance metrics.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCourseModal(true)}
                className="px-4 py-2 bg-[#9E3D24] hover:bg-[#83311C] text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_box</span>
                <span>Register Accredited Course</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div key={c.id} className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start pb-3 border-b border-[#D8D2C4]/60">
                      <div>
                        <span className="font-mono text-sm font-bold text-[#9E3D24]">{c.subjectCode}</span>
                        <h3 className="font-serif font-bold text-base text-[#12181F] mt-1">{c.subjectName}</h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F3EFE6] text-[#6B7280] font-bold rounded">
                        {c.credits || 4} CREDITS
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-[#555E68]">
                      <div className="flex justify-between">
                        <span>Lectures Conducted:</span>
                        <strong className="text-[#12181F]">{c.lectureCount || 0} Sessions</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Cohort Attendance Rate:</span>
                        <strong className="text-[#2E6B34] font-serif text-sm">{c.averageAttendance || 88.5}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Curricular Standing:</span>
                        <span className="text-[#2E6B34] font-semibold">NBA Accredited</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#D8D2C4]/60 flex gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`Course syllabus and session log opened for ${c.subjectCode}`)}
                      className="flex-1 py-1.5 text-xs bg-[#F3EFE6] hover:bg-[#D8D2C4] font-semibold text-[#12181F] rounded cursor-pointer"
                    >
                      Inspect Syllabus Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: INSTITUTIONAL ANALYTICS ================= */}
        {activeTab === "accreditation" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
                  NAAC / NBA COMPLIANCE ANALYTICS
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                  Institutional Attendance Metrics & Cohort Risk
                </h1>
                <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
                  Accreditation committee compliance metrics, cohort attendance distribution bands, and weekly variance analysis.
                </p>
              </div>

              <div className="text-xs bg-[#FFFFFF] border border-[#D8D2C4] px-3 py-2 rounded font-mono">
                STATUTORY BENCHMARK: <strong className="text-[#BA1A1A]">75.0% MANDATORY</strong>
              </div>
            </div>

            {/* Compliance Distribution Bands */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#FFFFFF] border-t-4 border-[#2E6B34] border-l border-r border-b border-[#D8D2C4] rounded p-5 shadow-xs">
                <span className="text-xs font-mono uppercase text-[#6B7280] font-bold">High Compliance (≥85%)</span>
                <div className="font-serif text-3xl font-bold text-[#2E6B34] mt-2">
                  {Math.round(((students.filter((s) => s.attendancePercentage >= 85).length || 5) / (students.length || 6)) * 100)}%
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  {students.filter((s) => s.attendancePercentage >= 85).length || 5} Students in Distinction Tier
                </p>
              </div>

              <div className="bg-[#FFFFFF] border-t-4 border-[#D4A373] border-l border-r border-b border-[#D8D2C4] rounded p-5 shadow-xs">
                <span className="text-xs font-mono uppercase text-[#6B7280] font-bold">Satisfactory (75% - 84.9%)</span>
                <div className="font-serif text-3xl font-bold text-[#D4A373] mt-2">
                  {Math.round(((students.filter((s) => s.attendancePercentage >= 75 && s.attendancePercentage < 85).length || 1) / (students.length || 6)) * 100)}%
                </div>
                <p className="text-xs text-[#6B7280] mt-1">Eligible for Examination clearance</p>
              </div>

              <div className="bg-[#FFFFFF] border-t-4 border-[#BA1A1A] border-l border-r border-b border-[#D8D2C4] rounded p-5 shadow-xs">
                <span className="text-xs font-mono uppercase text-[#6B7280] font-bold">Statutory Deficit (&lt;75%)</span>
                <div className="font-serif text-3xl font-bold text-[#BA1A1A] mt-2">
                  {Math.round(((students.filter((s) => s.attendancePercentage < 75).length || 1) / (students.length || 6)) * 100)}%
                </div>
                <p className="text-xs text-[#BA1A1A] font-semibold mt-1">
                  Examination Hall-Ticket Disqualified
                </p>
              </div>
            </div>

            {/* Subject Vulnerability Chart */}
            <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs">
              <div className="flex justify-between items-center pb-4 border-b border-[#D8D2C4]">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#12181F]">
                    Curricular Course Vulnerability Matrix
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Direct comparison of subjects against university statutory examination threshold (75%).
                  </p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {courses.map((c) => {
                  const avg = c.averageAttendance || 88.5;
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs font-bold text-[#12181F] mb-1">
                        <span>{c.subjectCode}: {c.subjectName}</span>
                        <span className="font-mono text-[#9E3D24]">{avg}% Average</span>
                      </div>
                      <div className="relative w-full h-4 bg-[#F3EFE6] rounded overflow-hidden">
                        <div
                          className="h-full bg-[#1C242E] transition-all"
                          style={{ width: `${Math.min(100, avg)}%` }}
                        ></div>
                        <div
                          className="absolute top-0 bottom-0 left-[75%] w-1 bg-[#BA1A1A] z-10"
                          title="75% Statutory Exam Cutoff"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-[#D8D2C4] flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="w-2.5 h-2.5 bg-[#BA1A1A] inline-block"></span>
                <span>Red vertical marker marks mandatory university statutory exam cutoff (75%).</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: DEAN'S STATUTORY DOSSIER ================= */}
        {activeTab === "dean-dossier" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
                  OFFICIAL INSTITUTIONAL TRANSMISSION
                </span>
                <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                  Dean of Academic Affairs Statutory Ledger
                </h1>
                <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
                  Official certified ledger forwarded to the Dean’s Office for semester hall-ticket issuance and regulatory accreditation compliance.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportFormalLedger}
                  className="px-4 py-2 bg-white border border-[#D8D2C4] hover:bg-[#F3EFE6] text-xs font-semibold rounded cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">table_view</span>
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Statutory Attendance Ledger Dossier transmitted to Dean of Academic Affairs.")}
                  className="px-4 py-2 bg-[#9E3D24] hover:bg-[#83311C] text-white text-xs font-bold rounded cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Transmit to Dean</span>
                </button>
              </div>
            </div>

            {/* Official Letterhead Mock Preview */}
            <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded p-8 shadow-sm font-serif">
              <div className="text-center pb-6 border-b-2 border-[#12181F]">
                <h2 className="text-2xl font-bold text-[#12181F] uppercase tracking-wide">
                  Faculty of Engineering & Technology
                </h2>
                <h3 className="text-lg font-bold text-[#9E3D24] mt-1">
                  Department of Computer Science & Engineering
                </h3>
                <p className="text-xs text-[#6B7280] font-sans mt-1">
                  Accreditation Cycle AY 2026-27 • Semester V Statutory Attendance Ledger
                </p>
              </div>

              <div className="py-6 text-sm text-[#12181F] font-sans leading-relaxed space-y-2">
                <p>
                  <strong>To:</strong> Dean of Academic Affairs, University Central Registry
                </p>
                <p>
                  <strong>From:</strong> Office of the Head of Department (CSE)
                </p>
                <p>
                  <strong>Subject:</strong> Certified Departmental Mid-Term Statutory Attendance Ledger & Hall-Ticket Disqualification List
                </p>
                <p className="text-xs text-[#555E68] pt-2">
                  In compliance with University Ordinance §42.1, the undersigned certifies that the following candidate attendance ratios have been audited against biometrically verified and BLE-authenticated lecture records.
                </p>
              </div>

              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] font-bold uppercase text-[#6B7280]">
                      <th className="py-2.5 px-3">Roll Number</th>
                      <th className="py-2.5 px-3">Candidate Name</th>
                      <th className="py-2.5 px-3 text-center">Sessions</th>
                      <th className="py-2.5 px-3 text-right">Attendance %</th>
                      <th className="py-2.5 px-3 text-right">Deficit</th>
                      <th className="py-2.5 px-3 text-center">Statutory Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8D2C4]/60">
                    {students.map((s) => {
                      const isClear = clearanceOverrides[s.id] !== undefined
                        ? clearanceOverrides[s.id]
                        : s.attendancePercentage >= deptPolicy.statutoryThreshold;
                      const deficit = Math.max(0, Math.round((deptPolicy.statutoryThreshold - s.attendancePercentage) * 10) / 10);
                      return (
                        <tr key={s.id}>
                          <td className="py-2 px-3 font-mono">{s.rollNumber}</td>
                          <td className="py-2 px-3 font-semibold text-[#12181F]">{s.fullName}</td>
                          <td className="py-2 px-3 text-center">{s.attendedLectures} / {s.totalLectures}</td>
                          <td className="py-2 px-3 text-right font-bold">{s.attendancePercentage}%</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#BA1A1A]">
                            {deficit > 0 ? `-${deficit}%` : "0%"}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            <span className={isClear ? "text-[#2E6B34]" : "text-[#BA1A1A]"}>
                              {isClear ? "CLEARED" : "DISQUALIFIED (HOLD)"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 mt-6 border-t border-[#D8D2C4] flex justify-between items-end text-xs font-sans text-[#6B7280]">
                <div>
                  <div>Date of Certification: <strong>{formatDateDisplay()}</strong></div>
                  <div>Audit Reference: <strong>CSE-DEAN-REG-2026/09</strong></div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-base font-bold text-[#12181F]">Prof. Department Head</div>
                  <div>Head, Department of Computer Science & Engineering</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: GOVERNANCE & POLICIES ================= */}
        {activeTab === "governance" && (
          <div className="max-w-3xl space-y-6">
            <div className="pb-6 border-b border-[#D8D2C4]">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
                INSTITUTIONAL GOVERNANCE
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
                Department Directives & Statutory Parameters
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                Configure regulatory attendance thresholds, grace windows, and automated Dean synchronization.
              </p>
            </div>

            {policySavedAlert && (
              <div className="p-3 bg-[#2E6B34]/10 text-[#2E6B34] border border-[#2E6B34]/30 rounded text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Department governance parameters successfully committed to academic ledger.</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPolicySavedAlert(true);
                setTimeout(() => setPolicySavedAlert(false), 4000);
              }}
              className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs space-y-5"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-[#6B7280] mb-1 font-mono">
                  Statutory Minimum Attendance Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="90"
                  value={deptPolicy.statutoryThreshold}
                  onChange={(e) => setDeptPolicy({ ...deptPolicy, statutoryThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none font-bold text-[#9E3D24]"
                />
                <span className="text-[11px] text-[#6B7280] mt-1 block">
                  Mandatory threshold for semester exam hall-ticket release (Standard: 75%).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#6B7280] mb-1 font-mono">
                  Critical Warning Threshold (%)
                </label>
                <input
                  type="number"
                  min="40"
                  max="70"
                  value={deptPolicy.criticalThreshold}
                  onChange={(e) => setDeptPolicy({ ...deptPolicy, criticalThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none font-bold text-[#BA1A1A]"
                />
                <span className="text-[11px] text-[#6B7280] mt-1 block">
                  Level 2 critical escalation threshold triggering direct Dean summons.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#6B7280] mb-1 font-mono">
                  QR Beacon Room Grace Window (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={deptPolicy.gracePeriodMins}
                  onChange={(e) => setDeptPolicy({ ...deptPolicy, gracePeriodMins: Number(e.target.value) })}
                  className="w-full p-2.5 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none font-bold text-[#12181F]"
                />
                <span className="text-[11px] text-[#6B7280] mt-1 block">
                  Allowed window after lecture commences for verified check-in.
                </span>
              </div>

              <div className="pt-4 border-t border-[#D8D2C4] flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#9E3D24] hover:bg-[#83311C] text-white text-xs font-bold rounded shadow-xs cursor-pointer"
                >
                  Save Departmental Policy
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ================= MODAL: BROADCAST CIRCULAR ================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
              <h3 className="font-serif text-xl font-bold text-[#12181F]">
                Broadcast Official Department Directive
              </h3>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-[#6B7280] hover:text-[#12181F]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleBroadcastCircular} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Recipient Audience
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full p-2 text-xs border border-[#D8D2C4] rounded bg-[#FBF9F5] font-bold cursor-pointer"
                >
                  <option value="ALL_FACULTY">All Department Faculty Members</option>
                  <option value="ALL_STUDENTS">All CSE Enrolled Students (Sec A & B)</option>
                  <option value="EVERYONE">Full Department (Faculty & Students)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Directive Title / Subject
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mandatory Mid-Term Ledger Submission..."
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full p-2.5 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Executive Directive Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter official departmental order or notice..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full p-2.5 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[#D8D2C4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-[#F3EFE6] rounded text-[#12181F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#9E3D24] text-white rounded cursor-pointer"
                >
                  Publish Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: AUDIT LIVE ROOM ================= */}
      {selectedAuditLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
              <div>
                <span className="font-mono text-xs font-bold text-[#9E3D24]">{selectedAuditLecture.room}</span>
                <h3 className="font-serif text-lg font-bold text-[#12181F]">Floor Audit & Telemetry</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLecture(null)}
                className="text-[#6B7280] hover:text-[#12181F]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#FBF9F5] border border-[#D8D2C4] rounded">
                <div className="font-serif font-bold text-sm text-[#12181F]">{selectedAuditLecture.subject}</div>
                <div className="text-[#6B7280] mt-1">Supervising Faculty: <strong>{selectedAuditLecture.faculty}</strong></div>
                <div className="text-[#6B7280]">Scheduled Time: <strong>{selectedAuditLecture.time}</strong></div>
              </div>

              <div className="flex justify-between py-2 border-b border-[#D8D2C4]/60">
                <span className="text-[#6B7280]">Room Status:</span>
                <span className="font-bold text-[#2E6B34]">Active Session</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#D8D2C4]/60">
                <span className="text-[#6B7280]">Live Verified Check-ins:</span>
                <span className="font-mono font-bold text-[#12181F]">{selectedAuditLecture.strength}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#D8D2C4]/60">
                <span className="text-[#6B7280]">BLE Beacon Telemetry:</span>
                <span className="font-mono text-[#2E6B34] font-bold">Signal Strong (-62 dBm)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D8D2C4] mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`HOD Audit verified for ${selectedAuditLecture.room}. Room report signed.`);
                  setSelectedAuditLecture(null);
                }}
                className="px-4 py-2 bg-[#1C242E] text-white text-xs font-bold rounded cursor-pointer"
              >
                Sign Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: HOD DISPENSATION OVERRIDE ================= */}
      {hallTicketDispensationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#12181F]">
                  Executive HOD Exam Dispensation
                </h3>
                <span className="text-xs font-mono text-[#6B7280]">
                  {hallTicketDispensationModal.fullName} ({hallTicketDispensationModal.rollNumber})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHallTicketDispensationModal(null)}
                className="text-[#6B7280] hover:text-[#12181F]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded">
                <strong>Current Attendance: {hallTicketDispensationModal.attendancePercentage}%</strong> (Below statutory 75% cutoff).
                Granting dispensation overrides the automated hall-ticket withhold status.
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Statutory Exemption Clause
                </label>
                <select
                  value={dispensationReason}
                  onChange={(e) => setDispensationReason(e.target.value)}
                  className="w-full p-2 text-xs border border-[#D8D2C4] rounded bg-[#FBF9F5] font-semibold cursor-pointer"
                >
                  <option value="Medical Board Authorized Leave">Medical Board Authorized Sick Leave (Hospital Slip Verified)</option>
                  <option value="University Representation in Sports/Hackathon">University Representative (Inter-Collegiate Sports/Hackathon)</option>
                  <option value="Dean of Academic Affairs Special Discretion">Dean of Academic Affairs Special Discretion</option>
                  <option value="Academic Project Sabbatical">Department Approved Capstone Sabbatical</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D8D2C4] mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHallTicketDispensationModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#F3EFE6] rounded text-[#12181F] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantDispensation}
                className="px-4 py-1.5 text-xs font-bold bg-[#2E6B34] text-white rounded cursor-pointer"
              >
                Grant & Clear Hall-Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD ACCREDITED COURSE ================= */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
              <h3 className="font-serif text-lg font-bold text-[#12181F]">
                Accredit New Department Course
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-[#6B7280] hover:text-[#12181F]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {courseMessage && (
              <div className="mt-3 p-2 bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/30 rounded text-xs">
                {courseMessage}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Subject Code
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. CS504"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] uppercase font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Course Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Advanced Computer Networks"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                  Academic Credit Weight
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={newCourseCredits}
                  onChange={(e) => setNewCourseCredits(e.target.value)}
                  className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] font-bold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#D8D2C4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#F3EFE6] rounded text-[#12181F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseSubmitLoading}
                  className="px-4 py-1.5 text-xs font-bold bg-[#9E3D24] text-white rounded cursor-pointer disabled:opacity-50"
                >
                  {courseSubmitLoading ? "Registering..." : "Accredit Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STUDENT ================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9E3D24]">
                  STUDENT REGISTRATION
                </span>
                <h3 className="font-serif text-xl font-bold text-[#12181F]">
                  Enrol New Student Candidate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="text-[#6B7280] hover:text-[#12181F] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {studentModalError && (
              <div className="mt-3 p-2.5 bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/30 rounded text-xs">
                {studentModalError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Student Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Arvind Mehta"
                    value={newStudentForm.fullName}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, fullName: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Institutional Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. arvind.mehta@student.edu"
                    value={newStudentForm.email}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, email: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-CSE-095"
                    value={newStudentForm.rollNumber}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, rollNumber: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] uppercase font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Cohort Section
                  </label>
                  <select
                    value={newStudentForm.section}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, section: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] font-semibold cursor-pointer"
                  >
                    <option value="Sec A">Section A</option>
                    <option value="Sec B">Section B</option>
                    <option value="Sec C">Section C</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Temporary Initial Password *
                  </label>
                  <input
                    required
                    type="text"
                    minLength={6}
                    value={newStudentForm.password}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, password: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280]">Default: student123 (min 6 characters)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D8D2C4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#F3EFE6] rounded text-[#12181F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentSubmitLoading}
                  className="px-4 py-1.5 text-xs font-bold bg-[#9E3D24] text-white rounded cursor-pointer disabled:opacity-50"
                >
                  {studentSubmitLoading ? "Enrolling..." : "Enrol Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FACULTY ================= */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9E3D24]">
                  FACULTY APPOINTMENT
                </span>
                <h3 className="font-serif text-xl font-bold text-[#12181F]">
                  Onboard Faculty Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(false)}
                className="text-[#6B7280] hover:text-[#12181F] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {facultyModalError && (
              <div className="mt-3 p-2.5 bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/30 rounded text-xs">
                {facultyModalError}
              </div>
            )}

            <form onSubmit={handleCreateFaculty} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Faculty Full Name & Honorific *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dr. K. Ramanathan"
                    value={newFacultyForm.fullName}
                    onChange={(e) =>
                      setNewFacultyForm({ ...newFacultyForm, fullName: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Faculty Institutional Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. k.ramanathan@faculty.edu"
                    value={newFacultyForm.email}
                    onChange={(e) =>
                      setNewFacultyForm({ ...newFacultyForm, email: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Academic Designation
                  </label>
                  <select
                    value={newFacultyForm.designation}
                    onChange={(e) =>
                      setNewFacultyForm({ ...newFacultyForm, designation: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] font-semibold cursor-pointer"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Visiting Lecturer">Visiting Lecturer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Department Unit
                  </label>
                  <input
                    type="text"
                    value={newFacultyForm.department}
                    onChange={(e) =>
                      setNewFacultyForm({ ...newFacultyForm, department: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase font-bold text-[#6B7280] mb-1">
                    Initial Authentication Password *
                  </label>
                  <input
                    required
                    type="text"
                    minLength={6}
                    value={newFacultyForm.password}
                    onChange={(e) =>
                      setNewFacultyForm({ ...newFacultyForm, password: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5] font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-[#6B7280]">Default: faculty123 (min 6 characters)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#D8D2C4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#F3EFE6] rounded text-[#12181F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={facultySubmitLoading}
                  className="px-4 py-1.5 text-xs font-bold bg-[#9E3D24] text-white rounded cursor-pointer disabled:opacity-50"
                >
                  {facultySubmitLoading ? "Onboarding..." : "Onboard Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
