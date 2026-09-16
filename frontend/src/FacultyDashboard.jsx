import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { Modal } from "./components/common/Modal";
import { FacultyOverviewTab } from "./components/faculty/FacultyOverviewTab";
import { FacultyLecturesTab } from "./components/faculty/FacultyLecturesTab";
import { FacultyAttendanceTab } from "./components/faculty/FacultyAttendanceTab";
import { FacultyCoursesTab } from "./components/faculty/FacultyCoursesTab";
import { FacultyScheduleTab } from "./components/faculty/FacultyScheduleTab";
import { FacultyReportsTab } from "./components/faculty/FacultyReportsTab";
import { FacultyStudentsTab } from "./components/faculty/FacultyStudentsTab";
import { FacultySettingsTab } from "./components/faculty/FacultySettingsTab";
import { useAuth } from "./hooks/useAuth";
import { useLectures } from "./hooks/useLectures";
import { useCourses } from "./hooks/useCourses";
import { lectureService } from "./services/lectureService";
import { courseService } from "./services/courseService";
import { authService } from "./services/authService";
import { attendanceService } from "./services/attendanceService";
import api, { authHeader } from "./services/api";
import {
  getFacultyAssignedSubjects,
  detectFacultyCode,
  getDepartmentTimetable,
} from "./data/departmentTimetables";

export default function FacultyDashboard({ user: initialUser, token, onLogout, onToggleRole }) {
  const { user, refreshUser } = useAuth(initialUser, token);
  const { lectures, subjects, fetchLectures } = useLectures(token);
  const { courses } = useCourses(token);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [qr, setQr] = useState(null);
  const [remaining, setRemaining] = useState(300);
  const [copied, setCopied] = useState(false);
  const [studentRoster, setStudentRoster] = useState([]);
  const [selectedRadius, setSelectedRadius] = useState(100);
  const [lectureAttendance, setLectureAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Department name and timetable-driven faculty code
  const facultyDeptName =
    user?.department ||
    user?.profile?.department ||
    "Department of Computer Science & Engineering";

  const [selectedFacultyCode, setSelectedFacultyCode] = useState(() =>
    detectFacultyCode(facultyDeptName, user)
  );

  // Auto-detect faculty code whenever user profile or email changes
  useEffect(() => {
    const code = detectFacultyCode(facultyDeptName, user);
    if (code) {
      setSelectedFacultyCode(code);
    }
  }, [facultyDeptName, user?.email, user?.full_name]);

  // Timetable-driven assigned subjects for this faculty member
  const facultyAssignedSubjects = React.useMemo(() => {
    return getFacultyAssignedSubjects(facultyDeptName, selectedFacultyCode || user, subjects);
  }, [facultyDeptName, selectedFacultyCode, user, subjects]);

  // Create lecture form state
  const [lectureForm, setLectureForm] = useState({
    subject_id: "1",
    lecture_date: new Date().toISOString().split("T")[0],
    start_time: "10:00:00",
    end_time: "11:30:00",
  });
  const [createMessage, setCreateMessage] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Modals
  const [showEditLectureModal, setShowEditLectureModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [enrolForm, setEnrolForm] = useState({
    fullName: "",
    email: "",
    password: "student123",
    rollNumber: "",
    studentPhone: "",
    parentPhone: "",
    department: "Department of Computer Science & Engineering",
    section: "Sec A",
  });

  // Sync lectureForm default subject with facultyAssignedSubjects
  useEffect(() => {
    if (
      facultyAssignedSubjects.length > 0 &&
      (!lectureForm.subject_id ||
        !facultyAssignedSubjects.some((s) => String(s.id) === String(lectureForm.subject_id)))
    ) {
      setLectureForm((prev) => ({
        ...prev,
        subject_id: String(facultyAssignedSubjects[0].id),
      }));
    }
  }, [facultyAssignedSubjects]);

  useEffect(() => {
    if (lectures.length > 0 && !selectedLectureId) {
      setSelectedLectureId(String(lectures[0].id));
    }
  }, [lectures]);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const { data } = await api.get("/users/students", authHeader(token));
        setStudentRoster(data.students || []);
      } catch (err) {
        console.error("Failed to fetch students roster:", err);
      }
    };
    if (activeTab === "students") fetchRoster();
  }, [activeTab, token]);

  const fetchLectureAttendance = async (lecId) => {
    const targetLecId = lecId || selectedLectureId || (lectures[0] && lectures[0].id);
    if (!targetLecId) return;
    setLoadingAttendance(true);
    try {
      const data = await attendanceService.getLectureAttendanceRoster(targetLecId, token);
      setLectureAttendance(data.attendance || []);
    } catch (err) {
      console.error("Failed to fetch lecture attendance roster:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch attendance when lecture selection changes or switching to attendance tab
  useEffect(() => {
    if (selectedLectureId) {
      fetchLectureAttendance(selectedLectureId);
    }
  }, [selectedLectureId, activeTab]);

  // Live polling: refresh roster every 2 seconds while QR broadcast is actively running
  useEffect(() => {
    if (!qr || remaining <= 0) return;
    const interval = setInterval(() => {
      fetchLectureAttendance(qr.lecture_id || selectedLectureId);
    }, 2000);
    return () => clearInterval(interval);
  }, [qr, remaining, selectedLectureId]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "lectures", label: "Lectures", icon: "co_present" },
    { id: "attendance", label: "Attendance", icon: "fact_check" },
    { id: "courses", label: "Courses", icon: "menu_book" },
    { id: "schedule", label: "Schedule", icon: "calendar_today" },
    { id: "reports", label: "Reports", icon: "analytics" },
    { id: "students", label: "Students", icon: "group" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const [stoppingQr, setStoppingQr] = useState(false);

  // Active QR countdown timer and auto-expire handler
  useEffect(() => {
    if (!qr || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // On natural expiration, immediately fetch attendance to display absent students
          fetchLectureAttendance(qr.lecture_id || selectedLectureId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qr, remaining, selectedLectureId]);

  const handleGenerateQR = async (lectureId, radius) => {
    const targetId = lectureId || selectedLectureId || (lectures[0] && lectures[0].id);
    if (!targetId) return;
    const targetLecture = lectures.find((l) => String(l.id) === String(targetId));

    const radiusToUse = radius !== undefined ? Number(radius) : Number(selectedRadius || 0);
    const geoOptions = { radius_meters: radiusToUse };

    // If Geo-Fencing is enabled (50m or 100m), pinpoint the classroom anchor to the faculty's CURRENT device location
    if (radiusToUse > 0) {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser. Please select 'Without Geo-Fence' or use a compatible browser.");
        return;
      }

      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        geoOptions.latitude = pos.coords.latitude;
        geoOptions.longitude = pos.coords.longitude;
      } catch (geoErr) {
        console.warn("Faculty device GPS acquisition error:", geoErr);
        const proceedWithout = window.confirm(
          "⚠️ Location Permission Needed for Classroom Geo-Fence:\n\n" +
          "To set this device's current location as the classroom anchor for " + radiusToUse + "m attendance, browser GPS permission is required.\n\n" +
          "Click OK to proceed WITHOUT Geo-Fence (Open attendance), or Cancel to enable location in your browser."
        );
        if (proceedWithout) {
          geoOptions.radius_meters = 0;
        } else {
          return;
        }
      }
    }

    try {
      const data = await lectureService.createQrSession(targetId, token, geoOptions);
      setQr({
        ...data,
        lecture_id: targetId,
        lecture: targetLecture,
      });
      setRemaining(data.expires_in || 300);
      setActiveTab("attendance");
      fetchLectureAttendance(targetId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate QR session.");
    }
  };

  const handleStopQR = async () => {
    if (!qr) return;
    setStoppingQr(true);
    const targetLecId = qr.lecture_id || selectedLectureId;
    try {
      await lectureService.stopQrSession(qr.session_token, targetLecId, token);
      // Immediately set remaining to 0 so UI reflects expired state
      setRemaining(0);
      // Immediately fetch attendance to display newly marked ABSENT students
      await fetchLectureAttendance(targetLecId);
    } catch (err) {
      console.error("Failed to stop QR session:", err);
      // Even if network fails, expire locally to stop displaying valid QR
      setRemaining(0);
      await fetchLectureAttendance(targetLecId);
    } finally {
      setStoppingQr(false);
    }
  };

  const handleUpdateAttendanceStatus = async (studentId, newStatus, attendanceId, targetLectureIdOverride) => {
    const targetLecId = targetLectureIdOverride || selectedLectureId || (qr && qr.lecture_id) || (lectures[0] && lectures[0].id);
    if (!targetLecId) return;

    // Optimistic UI update
    setLectureAttendance((prev) =>
      prev.map((att) =>
        String(att.student_id) === String(studentId)
          ? {
              ...att,
              status: newStatus,
              attendance_time: newStatus === "PRESENT" ? (att.attendance_time || new Date().toISOString()) : null,
              distance_meters: newStatus === "PRESENT" ? (att.distance_meters !== null ? att.distance_meters : 0) : null,
              location_verified: newStatus === "PRESENT",
            }
          : att
      )
    );

    try {
      await attendanceService.updateAttendanceStatus(
        {
          lectureId: targetLecId,
          studentId,
          attendanceId,
          status: newStatus,
        },
        token
      );
      // Re-fetch to guarantee database sync
      await fetchLectureAttendance(targetLecId);
    } catch (err) {
      console.error("Failed to update student attendance status:", err);
      alert(err.response?.data?.message || "Failed to update attendance status.");
      // Rollback
      fetchLectureAttendance(targetLecId);
    }
  };

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage("");
    try {
      const data = await lectureService.createLecture(lectureForm, token);
      setCreateMessage(data.message || "Lecture scheduled successfully!");
      fetchLectures();
    } catch (err) {
      setCreateMessage(err.response?.data?.message || "Failed to schedule lecture.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateLecture = async (e) => {
    e.preventDefault();
    if (!editingLecture) return;
    try {
      await lectureService.updateLecture(editingLecture.id, editingLecture, token);
      setShowEditLectureModal(false);
      fetchLectures();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update lecture.");
    }
  };

  const handleDeleteLecture = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await lectureService.deleteLecture(id, token);
      fetchLectures();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete lecture.");
    }
  };

  const nextLecture = lectures[0] || null;

  return (
    <ProtectedRoute user={user} allowedRoles={["FACULTY", "HOD"]}>
      <DashboardLayout
        user={user}
        onLogout={onLogout}
        onToggleRole={onToggleRole}
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="LectureLog"
        subtitle="Faculty Portal"
      >
        {activeTab === "dashboard" && (
          <FacultyOverviewTab
            user={user}
            nextLecture={nextLecture}
            totalClasses={lectures.length}
            onGenerateQR={handleGenerateQR}
            onNavigateTab={setActiveTab}
            assignedSubjectsCount={facultyAssignedSubjects.length}
            assignedSubjectsList={facultyAssignedSubjects}
          />
        )}

        {activeTab === "lectures" && (
          <FacultyLecturesTab
            lectures={lectures}
            subjectsList={facultyAssignedSubjects}
            lectureForm={lectureForm}
            setLectureForm={setLectureForm}
            createLoading={createLoading}
            createMessage={createMessage}
            onCreateLecture={handleCreateLecture}
            onOpenEdit={(lec) => {
              setEditingLecture(lec);
              setShowEditLectureModal(true);
            }}
            onDeleteLecture={handleDeleteLecture}
            onGenerateQR={handleGenerateQR}
            selectedFacultyCode={selectedFacultyCode}
            departmentName={facultyDeptName}
          />
        )}

        {activeTab === "attendance" && (
          <FacultyAttendanceTab
            lectures={lectures}
            selectedLectureId={selectedLectureId}
            setSelectedLectureId={setSelectedLectureId}
            qr={qr}
            onGenerateQR={handleGenerateQR}
            onStopQR={handleStopQR}
            stoppingQr={stoppingQr}
            remaining={remaining}
            copyToken={() => {
              if (qr?.session_token) {
                navigator.clipboard.writeText(qr.session_token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            copied={copied}
            selectedRadius={selectedRadius}
            setSelectedRadius={setSelectedRadius}
            attendanceRoster={lectureAttendance}
            loadingAttendance={loadingAttendance}
            onRefreshAttendance={() => fetchLectureAttendance(selectedLectureId)}
            isSessionActive={Boolean(qr && remaining > 0)}
            isSessionExpired={Boolean(qr && remaining <= 0)}
            onUpdateStatus={handleUpdateAttendanceStatus}
          />
        )}

        {activeTab === "courses" && (
          <FacultyCoursesTab
            courses={facultyAssignedSubjects}
            user={user}
            selectedFacultyCode={selectedFacultyCode}
            departmentName={facultyDeptName}
          />
        )}

        {activeTab === "schedule" && (
          <FacultyScheduleTab
            user={user}
            token={token}
            selectedFacultyCode={selectedFacultyCode}
            onSelectFacultyCode={setSelectedFacultyCode}
          />
        )}

        {activeTab === "reports" && (
          <FacultyReportsTab
            lectures={lectures}
            token={token}
            onUpdateStatus={handleUpdateAttendanceStatus}
          />
        )}
        {activeTab === "students" && (
          <FacultyStudentsTab
            studentRoster={studentRoster}
            onOpenEnrolModal={() => setShowEnrolModal(true)}
          />
        )}
        {activeTab === "settings" && <FacultySettingsTab user={user} onProfileUpdate={refreshUser} />}

        {/* Edit Lecture Modal */}
        <Modal
          isOpen={showEditLectureModal}
          onClose={() => setShowEditLectureModal(false)}
          title="Edit Lecture Session"
        >
          {editingLecture && (
            <form onSubmit={handleUpdateLecture} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-text-stone mb-1">Subject</label>
                <select
                  value={editingLecture.subject_id}
                  onChange={(e) => setEditingLecture({ ...editingLecture, subject_id: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-border-default rounded text-primary"
                >
                  {facultyAssignedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject_code} - {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase font-bold text-text-stone mb-1">Date</label>
                <input
                  type="date"
                  value={editingLecture.lecture_date || ""}
                  onChange={(e) => setEditingLecture({ ...editingLecture, lecture_date: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-border-default rounded text-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block uppercase font-bold text-text-stone mb-1">Start Time</label>
                  <input
                    type="time"
                    step="1"
                    value={editingLecture.start_time || ""}
                    onChange={(e) => setEditingLecture({ ...editingLecture, start_time: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-border-default rounded text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-text-stone mb-1">End Time</label>
                  <input
                    type="time"
                    step="1"
                    value={editingLecture.end_time || ""}
                    onChange={(e) => setEditingLecture({ ...editingLecture, end_time: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-border-default rounded text-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditLectureModal(false)}
                  className="px-4 py-2 bg-surface-container rounded font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-secondary text-on-secondary rounded font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Enrol Student Modal */}
        <Modal
          isOpen={showEnrolModal}
          onClose={() => setShowEnrolModal(false)}
          title="Onboard Candidate Student"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post("/users/students", enrolForm, authHeader(token));
                setShowEnrolModal(false);
                // Refresh roster
                const { data } = await api.get("/users/students", authHeader(token));
                setStudentRoster(data.students || []);
                alert("Student onboarded successfully!");
              } catch (err) {
                alert(err.response?.data?.message || "Failed to onboard student.");
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={enrolForm.fullName}
                onChange={(e) => setEnrolForm({ ...enrolForm, fullName: e.target.value })}
                className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. rahul.sharma@univ.edu"
                value={enrolForm.email}
                onChange={(e) => setEnrolForm({ ...enrolForm, email: e.target.value })}
                className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Enrollment No. / Roll No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-CSE-101"
                  value={enrolForm.rollNumber}
                  onChange={(e) => setEnrolForm({ ...enrolForm, rollNumber: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Cohort Section *</label>
                <select
                  value={enrolForm.section}
                  onChange={(e) => setEnrolForm({ ...enrolForm, section: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-border-default rounded font-semibold text-[#12181F] text-sm"
                >
                  <option value="Sec A">Sec A</option>
                  <option value="Sec B">Sec B</option>
                  <option value="Sec C">Sec C</option>
                  <option value="Sec D">Sec D</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Student Contact No.</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={enrolForm.studentPhone}
                  onChange={(e) => setEnrolForm({ ...enrolForm, studentPhone: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Parents Contact No.</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98123 45678"
                  value={enrolForm.parentPhone}
                  onChange={(e) => setEnrolForm({ ...enrolForm, parentPhone: e.target.value })}
                  className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
                />
              </div>
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Academic Department</label>
              <input
                type="text"
                value={enrolForm.department}
                onChange={(e) => setEnrolForm({ ...enrolForm, department: e.target.value })}
                className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={enrolForm.password}
                onChange={(e) => setEnrolForm({ ...enrolForm, password: e.target.value })}
                className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEnrolModal(false)} className="px-4 py-2 bg-surface-container font-bold rounded cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-secondary text-on-secondary font-bold rounded cursor-pointer shadow-xs">
                Enrol Student
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}