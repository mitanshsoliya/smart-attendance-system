import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { Modal } from "./components/common/Modal";
import { StudentOverviewTab } from "./components/student/StudentOverviewTab";
import { StudentAttendanceTab } from "./components/student/StudentAttendanceTab";
import { StudentCoursesTab } from "./components/student/StudentCoursesTab";
import { StudentTimetableTab } from "./components/student/StudentTimetableTab";
import { StudentReportsTab } from "./components/student/StudentReportsTab";
import { StudentSettingsTab } from "./components/student/StudentSettingsTab";
import { useAuth } from "./hooks/useAuth";
import { useAttendance } from "./hooks/useAttendance";
import { useCourses } from "./hooks/useCourses";
import QRScanner from "./QRScanner";

export default function StudentDashboard({ user: initialUser, token, onLogout, onToggleRole }) {
  const { user } = useAuth(initialUser, token);
  const { attendanceRecords, markAttendance, fetchMyAttendance } = useAttendance(token);
  const { courses } = useCourses(token);

  const [activeTab, setActiveTab] = useState("overview");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  useEffect(() => {
    fetchMyAttendance();
  }, [token]);

  const navItems = [
    { id: "overview", label: "Dashboard", icon: "dashboard" },
    { id: "attendance", label: "Attendance Logs", icon: "fact_check" },
    { id: "timetable", label: "Timetable", icon: "calendar_today" },
    { id: "reports", label: "Reports", icon: "analytics" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const handleScanSuccess = async (scannedCode) => {
    if (!scannedCode) return;
    const res = await markAttendance(scannedCode);
    if (res.success) {
      setScanMessage(res.data?.message || "Attendance recorded successfully!");
      fetchMyAttendance();
      setTimeout(() => {
        setShowQRScanner(false);
        setScanMessage("");
      }, 2000);
    } else {
      setScanMessage(res.error || "Attendance verification failed.");
    }
  };

  return (
    <ProtectedRoute user={user} allowedRoles={["STUDENT"]}>
      <DashboardLayout
        user={user}
        onLogout={onLogout}
        onToggleRole={onToggleRole}
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="LectureLog"
        subtitle="Student Portal"
        actionButton={
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-full bg-secondary text-on-secondary py-2.5 px-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 font-medium text-xs cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Scan Classroom QR</span>
          </button>
        }
      >
        {activeTab === "overview" && (
          <StudentOverviewTab
            user={user}
            attendanceRecords={attendanceRecords}
            courses={courses}
            onScanQR={() => setShowQRScanner(true)}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === "attendance" && (
          <StudentAttendanceTab
            attendanceRecords={attendanceRecords}
            onScanQR={() => setShowQRScanner(true)}
          />
        )}
        {activeTab === "timetable" && <StudentTimetableTab />}
        {activeTab === "reports" && <StudentReportsTab attendanceRecords={attendanceRecords} />}
        {activeTab === "settings" && <StudentSettingsTab user={user} token={token} />}

        {/* QR Scanner Modal */}
        <Modal
          isOpen={showQRScanner}
          onClose={() => {
            setShowQRScanner(false);
            setScanMessage("");
          }}
          title="Scan Classroom Attendance QR"
          subtitle="Align the dynamic QR code displayed on the classroom screen within the camera frame."
        >
          <div className="space-y-4 text-center">
            {scanMessage && (
              <div className="p-3 bg-surface-container border-l-4 border-secondary text-xs font-semibold text-primary">
                {scanMessage}
              </div>
            )}
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}