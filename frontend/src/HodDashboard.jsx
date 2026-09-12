import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { Modal } from "./components/common/Modal";
import { HodOverviewTab } from "./components/hod/HodOverviewTab";
import { HodStudentsTab } from "./components/hod/HodStudentsTab";
import { HodFacultyTab } from "./components/hod/HodFacultyTab";
import { HodDepartmentsTab } from "./components/hod/HodDepartmentsTab";
import { HodCoursesTab } from "./components/hod/HodCoursesTab";
import { HodAnalyticsTab } from "./components/hod/HodAnalyticsTab";
import { HodReportsTab } from "./components/hod/HodReportsTab";
import { HodSettingsTab } from "./components/hod/HodSettingsTab";
import { useAuth } from "./hooks/useAuth";
import { hodService } from "./services/hodService";
import { courseService } from "./services/courseService";

export default function HodDashboard({ user: initialUser, token, onLogout, onToggleRole }) {
  const { user } = useAuth(initialUser, token);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: "",
    email: "",
    password: "student123",
    rollNumber: "",
    studentPhone: "",
    parentPhone: "",
    department: "Department of Computer Science & Engineering",
    section: "Sec A",
  });
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [newFacultyForm, setNewFacultyForm] = useState({
    fullName: "",
    email: "",
    password: "faculty123",
    contactNo: "",
    department: "Department of Computer Science & Engineering",
    designation: "Assistant Professor",
  });
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({ subject_code: "", subject_name: "", credit_hours: "4" });

  const fetchAllData = useCallback(async () => {
    if (!token) return;

    try {
      const sData = await hodService.getHodStats(token).catch((err) => {
        console.error("Fetch HOD stats failed:", err);
        return null;
      });
      if (sData) setStats(sData.data || sData);
    } catch (e) {}

    try {
      const stData = await hodService.getHodStudents(token).catch((err) => {
        console.error("Fetch HOD students failed:", err);
        return null;
      });
      if (stData) {
        const studentList = stData.students || stData.data?.students || (Array.isArray(stData) ? stData : []);
        setStudents(studentList);
      }
    } catch (e) {}

    try {
      const fData = await hodService.getHodFaculty(token).catch((err) => {
        console.error("Fetch HOD faculty failed:", err);
        return null;
      });
      if (fData) {
        const facultyList = fData.faculty || fData.data?.faculty || (Array.isArray(fData) ? fData : []);
        setFaculty(facultyList);
      }
    } catch (e) {}

    try {
      const cData = await courseService.getCourses(token).catch((err) => {
        console.error("Fetch courses failed:", err);
        return null;
      });
      if (cData) {
        const courseList = cData.subjects || cData.data?.subjects || (Array.isArray(cData) ? cData : []);
        setCourses(courseList);
      }
    } catch (e) {}
  }, [token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const navItems = [
    { id: "dashboard", altId: "overview", label: "Dashboard", icon: "dashboard", badge: "Live" },
    { id: "students", altId: "hall-tickets", label: "Students", icon: "group", count: students.length },
    { id: "faculty", altId: "faculty-gov", label: "Faculty", icon: "supervisor_account", count: faculty.length },
    { id: "departments", altId: "departments", label: "Departments", icon: "apartment" },
    { id: "analytics", altId: "accreditation", label: "Attendance Analytics", icon: "analytics" },
    { id: "reports", altId: "dean-dossier", label: "Reports", icon: "assessment" },
    { id: "settings", altId: "governance", label: "Settings", icon: "settings" },
  ];

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await hodService.addHodStudent(newStudentForm, token);
      setShowAddStudentModal(false);
      fetchAllData();
      alert("Student onboarded successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to onboard student.");
    }
  };

  const handleAddFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      await hodService.addHodFaculty(newFacultyForm, token);
      setShowAddFacultyModal(false);
      fetchAllData();
      alert("Faculty member onboarded successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to onboard faculty member.");
    }
  };

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      await courseService.createCourse(newCourseForm, token);
      setShowAddCourseModal(false);
      fetchAllData();
      alert("Course registered in curriculum!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register course.");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;
    try {
      await hodService.deleteHodStudent(id, token);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const handleDeleteFaculty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this faculty record?")) return;
    try {
      await hodService.deleteHodFaculty(id, token);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete faculty.");
    }
  };

  const exportFormalLedger = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Roll Number,Name,Email,Section,Attended,Total,Attendance %,Status"]
        .concat(students.map((s) => `${s.rollNumber},${s.fullName},${s.email},${s.section},${s.attendedLectures},${s.totalLectures},${s.attendancePercentage}%,${s.status}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Attendance_Ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute user={user} allowedRoles={["HOD", "ADMIN"]}>
      <DashboardLayout
        user={user}
        onLogout={onLogout}
        onToggleRole={onToggleRole}
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="LectureLog"
        subtitle="Office of the HOD"
        actionButton={
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="w-full bg-[#9E3D24] text-white py-2.5 px-4 rounded hover:bg-[#83311C] transition-all flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Onboard Student</span>
          </button>
        }
      >
        {(activeTab === "dashboard" || activeTab === "overview") && (
          <HodOverviewTab
            stats={stats}
            studentsCount={students.length}
            facultyCount={faculty.length}
            coursesCount={courses.length}
            onExportLedger={exportFormalLedger}
          />
        )}
        {(activeTab === "students" || activeTab === "hall-tickets") && (
          <HodStudentsTab
            students={students}
            onOpenAddModal={() => setShowAddStudentModal(true)}
            onDeleteStudent={handleDeleteStudent}
            onExportLedger={exportFormalLedger}
          />
        )}
        {(activeTab === "faculty" || activeTab === "faculty-gov") && (
          <HodFacultyTab
            faculty={faculty}
            onOpenAddFacultyModal={() => setShowAddFacultyModal(true)}
            onDeleteFaculty={handleDeleteFaculty}
          />
        )}
        {activeTab === "departments" && (
          <HodDepartmentsTab
            stats={stats}
            studentsCount={students.length}
            facultyCount={faculty.length}
            coursesCount={courses.length}
          />
        )}
        {(activeTab === "analytics" || activeTab === "accreditation") && (
          <HodAnalyticsTab students={students} />
        )}
        {(activeTab === "reports" || activeTab === "dean-dossier") && (
          <HodReportsTab students={students} onExportLedger={exportFormalLedger} />
        )}
        {(activeTab === "settings" || activeTab === "governance") && <HodSettingsTab />}

        {/* Add Student Modal */}
        <Modal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          title="Onboard Candidate Student"
        >
          <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={newStudentForm.fullName}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. rahul.sharma@univ.edu"
                value={newStudentForm.email}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Enrollment No. / Roll No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-CSE-101"
                  value={newStudentForm.rollNumber}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, rollNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Cohort Section *</label>
                <select
                  value={newStudentForm.section}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, section: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded font-semibold text-[#12181F]"
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
                  value={newStudentForm.studentPhone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, studentPhone: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Parents Contact No.</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98123 45678"
                  value={newStudentForm.parentPhone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
                />
              </div>
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Academic Department</label>
              <input
                type="text"
                value={newStudentForm.department}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, department: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newStudentForm.password}
                onChange={(e) => setNewStudentForm({ ...newStudentForm, password: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddStudentModal(false)} className="px-4 py-2 bg-surface-container font-bold rounded cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-[#9E3D24] text-white font-bold rounded cursor-pointer shadow-xs">
                Enrol Student
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Faculty Modal */}
        <Modal
          isOpen={showAddFacultyModal}
          onClose={() => setShowAddFacultyModal(false)}
          title="Onboard Faculty Member"
        >
          <form onSubmit={handleAddFacultySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Faculty Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Ananya Sen"
                value={newFacultyForm.fullName}
                onChange={(e) => setNewFacultyForm({ ...newFacultyForm, fullName: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F]"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. ananya.sen@univ.edu"
                value={newFacultyForm.email}
                onChange={(e) => setNewFacultyForm({ ...newFacultyForm, email: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Contact No. / Phone *</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 12345"
                  value={newFacultyForm.contactNo}
                  onChange={(e) => setNewFacultyForm({ ...newFacultyForm, contactNo: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F]"
                />
              </div>
              <div>
                <label className="block uppercase font-bold text-[#6B7280] mb-1">Designation</label>
                <select
                  value={newFacultyForm.designation}
                  onChange={(e) => setNewFacultyForm({ ...newFacultyForm, designation: e.target.value })}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded font-semibold text-[#12181F] text-sm"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Adjunct Lecturer">Adjunct Lecturer</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Academic Department *</label>
              <input
                type="text"
                required
                value={newFacultyForm.department}
                onChange={(e) => setNewFacultyForm({ ...newFacultyForm, department: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F]"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newFacultyForm.password}
                onChange={(e) => setNewFacultyForm({ ...newFacultyForm, password: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddFacultyModal(false)} className="px-4 py-2 bg-surface-container font-bold rounded cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-[#9E3D24] text-white font-bold rounded cursor-pointer shadow-xs">
                Onboard Faculty
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Course Modal */}
        <Modal
          isOpen={showAddCourseModal}
          onClose={() => setShowAddCourseModal(false)}
          title="Register Accredited Course"
        >
          <form onSubmit={handleAddCourseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Subject Code *</label>
              <input
                type="text"
                required
                placeholder="CS505"
                value={newCourseForm.subject_code}
                onChange={(e) => setNewCourseForm({ ...newCourseForm, subject_code: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded uppercase font-mono"
              />
            </div>
            <div>
              <label className="block uppercase font-bold text-[#6B7280] mb-1">Subject Name *</label>
              <input
                type="text"
                required
                placeholder="Compiler Design"
                value={newCourseForm.subject_name}
                onChange={(e) => setNewCourseForm({ ...newCourseForm, subject_name: e.target.value })}
                className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 bg-surface-container font-bold rounded">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-[#9E3D24] text-white font-bold rounded">
                Register Course
              </button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
