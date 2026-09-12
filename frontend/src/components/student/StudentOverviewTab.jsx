import React from "react";
import { formatShortDate } from "../../utils/formatters";

export function StudentOverviewTab({ user, attendanceRecords, courses, onScanQR, onNavigateTab }) {
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const totalLectures = Math.max(attendanceRecords.length, 12);
  const attendancePercentage = Math.round((presentCount / totalLectures) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-surface-warm border border-border-default rounded p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-secondary font-mono tracking-wider">
            Student Academic Workspace
          </span>
          <h1 className="font-serif-display text-3xl text-primary font-bold mt-1">
            Welcome back, {user?.full_name || "Student"}!
          </h1>
          <p className="text-sm text-text-stone mt-1">
            Roll Number: <strong className="font-mono text-primary">{user?.roll_number || "2024-CSE-001"}</strong> • Section: <strong className="text-primary">{user?.section || "Sec A"}</strong>
          </p>
        </div>
        <button
          onClick={onScanQR}
          className="px-6 py-3 bg-secondary text-on-secondary font-label-md text-sm font-semibold rounded hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          <span>Scan Attendance QR</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-bright border border-border-default p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-text-stone">Overall Attendance</span>
          <div className="font-serif-display text-4xl font-bold text-primary mt-2">
            {attendancePercentage}%
          </div>
          <p className="text-xs text-success font-semibold mt-1">Status: Eligible for Examination</p>
        </div>

        <div className="bg-surface-bright border border-border-default p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-text-stone">Lectures Attended</span>
          <div className="font-serif-display text-4xl font-bold text-primary mt-2">
            {presentCount} / {totalLectures}
          </div>
          <p className="text-xs text-text-stone mt-1">Verified via QR Scanner</p>
        </div>

        <div className="bg-surface-bright border border-border-default p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-text-stone">Enrolled Courses</span>
          <div className="font-serif-display text-4xl font-bold text-primary mt-2">
            {courses.length || 4}
          </div>
          <p className="text-xs text-text-stone mt-1">Fall Semester 2026</p>
        </div>
      </div>

      {/* Recent Attendance Activity */}
      <div className="bg-surface-bright border border-border-default rounded p-6 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-lg font-bold text-primary">Recent Verification Logs</h3>
          <button
            onClick={() => onNavigateTab("attendance")}
            className="text-xs text-secondary font-semibold hover:underline cursor-pointer"
          >
            View Full History →
          </button>
        </div>

        {attendanceRecords.length === 0 ? (
          <div className="p-6 text-center text-text-stone text-sm">
            No attendance records logged yet. Use the "Scan Attendance QR" button above during lectures!
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceRecords.slice(0, 5).map((rec) => (
              <div key={rec.id} className="p-3 border border-border-default rounded flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-primary">{rec.subject_name || "Lecture Session"}</h4>
                  <p className="text-xs text-text-stone font-mono">{rec.subject_code || "CS501"} • {formatShortDate(rec.lecture_date)}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-success/20 text-success rounded uppercase">
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
