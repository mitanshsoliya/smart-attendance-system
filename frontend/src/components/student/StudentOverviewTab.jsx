import React from "react";
import { formatShortDate } from "../../utils/formatters";
import { AttendanceRing } from "../common/AttendanceRing";
import { LiveCampusPulse } from "../common/LiveCampusPulse";
import { VerticalVerificationTimeline } from "../common/VerticalVerificationTimeline";

export function StudentOverviewTab({ user, attendanceRecords = [], courses = [], onScanQR, onNavigateTab }) {
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const totalLectures = Math.max(attendanceRecords.length, 12);
  const attendancePercentage = Math.round((presentCount / totalLectures) * 100);
  const missedCount = Math.max(0, totalLectures - presentCount);
  const isCleared = attendancePercentage >= 75;

  const rollNumber = user?.roll_number || user?.profile?.roll_number || "2024-CSE-001";
  const section = user?.section || user?.profile?.section || "Sec A";
  const department = user?.department || user?.profile?.department || "Computer Science & Engineering";
  const fullName = user?.full_name || "Student";

  // Mock course attendance breakdown if empty, or calculate from real records
  const subjectsWithStats = courses.length > 0
    ? courses.map((c) => {
        const recordsForCourse = attendanceRecords.filter(
          (r) => r.subject_code === c.subject_code || r.subject_name === c.subject_name
        );
        const subPresent = recordsForCourse.filter((r) => r.status === "PRESENT").length;
        const subTotal = recordsForCourse.length || 6;
        const subPct = Math.round((subPresent / subTotal) * 100) || (c.id % 2 === 0 ? 88 : 78);
        return {
          ...c,
          present: subPresent || Math.round((subPct / 100) * subTotal),
          total: subTotal,
          percentage: subPct,
        };
      })
    : [
        { id: 1, subject_code: "CS501", subject_name: "Database Systems", credit_hours: 4, percentage: 91, present: 11, total: 12 },
        { id: 2, subject_code: "CS502", subject_name: "Computer Networks", credit_hours: 4, percentage: 83, present: 10, total: 12 },
        { id: 3, subject_code: "CS503", subject_name: "Operating Systems", credit_hours: 4, percentage: 75, present: 9, total: 12 },
        { id: 4, subject_code: "MA504", subject_name: "Mathematics II", credit_hours: 3, percentage: 85, present: 10, total: 12 },
      ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-container/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                STUDENT ACADEMIC PORTAL
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container text-text-stone">
                AY 2026–27 (Winter Term)
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Welcome back, {fullName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-1">
              Track your course attendance in real-time, view verified QR check-ins, and ensure exam clearance compliance.
            </p>

            {/* Academic Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border-default/60 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
                <span>Roll: <strong className="font-mono text-primary font-bold">{rollNumber}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">groups</span>
                <span>Section: <strong className="font-bold text-primary">{section}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">school</span>
                <span>{department}</span>
              </div>
            </div>
          </div>

          {/* Prominent Quick Action Button */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <button
              onClick={onScanQR}
              className="px-6 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                qr_code_scanner
              </span>
              <span>Scan Attendance QR</span>
            </button>
            <button
              onClick={() => onNavigateTab("timetable")}
              className="px-4 py-3.5 bg-surface-bright border border-border-default text-primary hover:bg-surface-container font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Modern KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Overall Ratio Ring */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <AttendanceRing percentage={attendancePercentage} size={90} strokeWidth={9} />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone block">
              Aggregate Ratio
            </span>
            <div className="font-heading text-2xl font-black text-primary mt-0.5">
              {attendancePercentage}%
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                isCleared
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">
                {isCleared ? "check_circle" : "warning"}
              </span>
              {isCleared ? "Cleared (≥75%)" : "Shortage Risk (<75%)"}
            </span>
          </div>
        </div>

        {/* KPI 2: Attended Sessions */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
                Attended Classes
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
              </span>
            </div>
            <div className="font-heading text-2xl font-black text-primary mt-2">
              {presentCount}{" "}
              <span className="text-xs font-normal text-text-stone">/ {totalLectures} lectures</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((presentCount / totalLectures) * 100))}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-text-stone mt-1.5 block font-medium">
              Verified in classroom
            </span>
          </div>
        </div>

        {/* KPI 3: Missed Classes */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
                Missed / Absent
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">event_busy</span>
              </span>
            </div>
            <div className="font-heading text-2xl font-black text-primary mt-2">
              {missedCount}{" "}
              <span className="text-xs font-normal text-text-stone">sessions</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
              Allowed safe margin: ~{Math.max(0, Math.floor(totalLectures * 0.25) - missedCount)} more
            </span>
          </div>
        </div>

        {/* KPI 4: Enrolled Courses */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
                Enrolled Subjects
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
              </span>
            </div>
            <div className="font-heading text-2xl font-black text-primary mt-2">
              {subjectsWithStats.length}{" "}
              <span className="text-xs font-normal text-text-stone">registered</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-medium text-text-stone">
              18 Total Credit Hours
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left Column (Courses & Activity) + Right Column (Timeline & Next Lecture) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Subject-Wise Attendance Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-default">
              <div>
                <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                  Subject-Wise Attendance Breakdown
                </h3>
                <p className="text-xs text-text-stone mt-0.5">
                  Real-time ratio per enrolled course. Minimum requirement is 75% under University Ordinance §42.1.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("attendance")}
                className="text-xs font-bold text-primary hover:underline shrink-0"
              >
                View History &rarr;
              </button>
            </div>

            <div className="space-y-4">
              {subjectsWithStats.map((sub) => {
                const pct = sub.percentage;
                const statusColor =
                  pct >= 75 ? "bg-emerald-500" : pct >= 65 ? "bg-amber-500" : "bg-rose-500";
                const badgeColor =
                  pct >= 75
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : pct >= 65
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200";

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 bg-surface-container-low rounded-xl border border-border-default/70 hover:border-border-default transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {sub.subject_code}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-primary">
                          {sub.subject_name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                      >
                        {pct}% ({sub.present}/{sub.total})
                      </span>
                    </div>

                    <div className="w-full bg-surface-container rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className={`${statusColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Check-in Activity Log */}
          <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-default">
              <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                Recent Check-in Activity
              </h3>
              <button
                onClick={() => onNavigateTab("attendance")}
                className="text-xs font-bold text-primary hover:underline"
              >
                All Logs &rarr;
              </button>
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-stone space-y-2">
                <span className="material-symbols-outlined text-3xl text-text-stone/60">
                  qr_code_2
                </span>
                <p>No check-in activity recorded yet.</p>
                <p className="text-[11px] text-text-muted">
                  Scan the dynamic QR code during classroom lectures to log your attendance!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-default/60">
                {attendanceRecords.slice(0, 4).map((rec) => (
                  <div
                    key={rec.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-primary">
                          {rec.subject_name || "Lecture Session"}
                        </h5>
                        <p className="text-[11px] text-text-stone font-mono">
                          {rec.subject_code || "CS501"} • {formatShortDate(rec.lecture_date)} •{" "}
                          {rec.attendance_time
                            ? new Date(rec.attendance_time).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "Recorded"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`self-start sm:self-auto px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                        rec.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security Audit & Next Session */}
        <div className="space-y-6">
          {/* Vertical Verification Timeline */}
          <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs">
            <VerticalVerificationTimeline />
          </div>

          {/* Quick Notice Card */}
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-5 text-white shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-200">
                shield_lock
              </span>
              <h4 className="font-heading font-bold text-sm">Anti-Proxy Protection</h4>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Your attendance is locked to this hardware device. Any attempt to share QR tokens, use location spoofers, or record from remote networks will automatically lock your account.
            </p>
            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-200">
              <span>HOD Authorization Required for Device Reset</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
