import React from "react";
import { formatShortDate } from "../../utils/formatters";
import { AttendanceRing } from "../common/AttendanceRing";
import { LiveCampusPulse } from "../common/LiveCampusPulse";
import { VerticalVerificationTimeline } from "../common/VerticalVerificationTimeline";

export function StudentOverviewTab({ user, attendanceRecords, courses, onScanQR, onNavigateTab }) {
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const totalLectures = Math.max(attendanceRecords.length, 12);
  const attendancePercentage = Math.round((presentCount / totalLectures) * 100);

  return (
    <div className="space-y-8">
      {/* Live Campus Pulse Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <LiveCampusPulse statusText="Campus Attendance Engine Online" activeCount={courses.length || 4} />
        <span className="font-mono text-xs text-[#6B7280]">
          ACCREDITATION CUTOFF: <strong className="text-[#9E3D24]">75.0% MANDATORY</strong>
        </span>
      </div>

      {/* Welcome Banner */}
      <div className="bg-[#FBF9F5] border border-[#D8D2C4] rounded p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase font-bold text-[#9E3D24] font-mono tracking-wider">
            Student Academic Workspace
          </span>
          <h1 className="font-serif-display text-3xl text-[#12181F] font-bold mt-1">
            Welcome back, {user?.full_name || "Student"}!
          </h1>
          <p className="text-sm text-[#555E68] mt-1">
            Roll Number: <strong className="font-mono text-[#12181F]">{user?.roll_number || "2024-CSE-001"}</strong> • Section: <strong className="text-[#12181F]">{user?.section || "Sec A"}</strong>
          </p>
        </div>
        <button
          onClick={onScanQR}
          className="px-6 py-3 bg-[#9E3D24] text-white font-bold text-xs rounded hover:bg-[#83311C] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          <span>Scan Attendance QR</span>
        </button>
      </div>

      {/* Attendance Ring & Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#D8D2C4] p-6 rounded shadow-xs flex flex-col items-center justify-center">
          <AttendanceRing percentage={attendancePercentage} size={140} label="Statutory Ratio" />
        </div>

        <div className="md:col-span-2 bg-white border border-[#D8D2C4] p-6 rounded shadow-xs space-y-4">
          <h3 className="font-serif text-xl font-bold text-[#12181F]">Academic Clearance Status</h3>
          <p className="text-xs text-[#555E68] leading-relaxed">
            Your current aggregate attendance ratio stands at <strong className="text-[#2E6B34]">{attendancePercentage}%</strong>. Candidates above 75% are cleared for end-semester examinations under Ordinance §42.1.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#D8D2C4] text-xs font-mono">
            <div>
              <span className="text-[#6B7280] block">Attended Sessions</span>
              <strong className="text-base text-[#12181F]">{presentCount} / {totalLectures}</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">Enrolled Courses</span>
              <strong className="text-base text-[#12181F]">{courses.length || 4} Subjects</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Timeline & Activity Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#D8D2C4] p-6 rounded shadow-xs">
          <VerticalVerificationTimeline />
        </div>

        <div className="bg-white border border-[#D8D2C4] p-6 rounded shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#D8D2C4]">
            <h3 className="font-serif text-lg font-bold text-[#12181F]">Recent Check-in Activity</h3>
            <button onClick={() => onNavigateTab("attendance")} className="text-xs text-[#9E3D24] font-bold hover:underline">
              Full Log →
            </button>
          </div>

          {attendanceRecords.length === 0 ? (
            <p className="text-xs text-[#6B7280] py-4 text-center">No attendance logs found. Scan classroom QR code during live lectures!</p>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.slice(0, 4).map((rec) => (
                <div key={rec.id} className="p-3 bg-[#FBF9F5] border border-[#D8D2C4] rounded flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-[#12181F]">{rec.subject_name || "Lecture Session"}</h4>
                    <span className="font-mono text-[10px] text-[#6B7280]">{rec.subject_code || "CS501"} • {formatShortDate(rec.lecture_date)}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#2E6B34]/15 text-[#2E6B34] rounded uppercase">
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
