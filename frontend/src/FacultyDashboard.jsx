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
import api, { authHeader } from "./services/api";

export default function FacultyDashboard({ user: initialUser, token, onLogout, onToggleRole }) {
  const { user } = useAuth(initialUser, token);
  const { lectures, subjects, fetchLectures } = useLectures(token);
  const { courses } = useCourses(token);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [qr, setQr] = useState(null);
  const [remaining, setRemaining] = useState(300);
  const [copied, setCopied] = useState(false);
  const [studentRoster, setStudentRoster] = useState([]);

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
  const [enrolForm, setEnrolForm] = useState({ fullName: "", email: "", rollNumber: "", section: "Sec A" });

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

  const handleGenerateQR = async (lectureId) => {
    const targetId = lectureId || selectedLectureId || (lectures[0] && lectures[0].id);
    if (!targetId) return;
    try {
      const data = await lectureService.createQrSession(targetId, token);
      setQr(data);
      setRemaining(data.expires_in || 300);
      setActiveTab("attendance");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate QR session.");
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
        actionButton={
          <button
            onClick={() => handleGenerateQR()}
            className="w-full bg-secondary text-on-secondary py-2.5 px-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 font-medium text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Start Attendance</span>
          </button>
        }
      >
        {activeTab === "dashboard" && (
          <FacultyOverviewTab
            user={user}
            nextLecture={nextLecture}
            totalClasses={lectures.length}
            onGenerateQR={handleGenerateQR}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "lectures" && (
          <FacultyLecturesTab
            lectures={lectures}
            subjectsList={subjects}
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
          />
        )}

        {activeTab === "attendance" && (
          <FacultyAttendanceTab
            lectures={lectures}
            selectedLectureId={selectedLectureId}
            setSelectedLectureId={setSelectedLectureId}
            qr={qr}
            onGenerateQR={handleGenerateQR}
            remaining={remaining}
            copyToken={() => {
              if (qr?.session_token) {
                navigator.clipboard.writeText(qr.session_token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            copied={copied}
          />
        )}

        {activeTab === "courses" && <FacultyCoursesTab courses={courses} />}
        {activeTab === "schedule" && <FacultyScheduleTab />}
        {activeTab === "reports" && <FacultyReportsTab lectures={lectures} />}
        {activeTab === "students" && (
          <FacultyStudentsTab
            studentRoster={studentRoster}
            onOpenEnrolModal={() => setShowEnrolModal(true)}
          />
        )}
        {activeTab === "settings" && <FacultySettingsTab user={user} />}

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
                  {subjects.map((s) => (
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
                    type="text"
                    value={editingLecture.start_time || ""}
                    onChange={(e) => setEditingLecture({ ...editingLecture, start_time: e.target.value })}
                    className="w-full p-2.5 bg-surface border border-border-default rounded text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-text-stone mb-1">End Time</label>
                  <input
                    type="text"
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
          title="Enrol Candidate Student"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowEnrolModal(false);
              alert("Student enrolled successfully!");
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block uppercase font-bold text-text-stone mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={enrolForm.fullName}
                onChange={(e) => setEnrolForm({ ...enrolForm, fullName: e.target.value })}
                className="w-full p-2.5 bg-surface border border-border-default rounded"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-text-stone mb-1">Email *</label>
              <input
                type="email"
                required
                value={enrolForm.email}
                onChange={(e) => setEnrolForm({ ...enrolForm, email: e.target.value })}
                className="w-full p-2.5 bg-surface border border-border-default rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEnrolModal(false)} className="px-4 py-2 bg-surface-container font-bold rounded">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-secondary text-on-secondary font-bold rounded">
                Enrol Student
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}