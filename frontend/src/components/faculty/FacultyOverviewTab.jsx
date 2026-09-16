import React from "react";
import { formatShortDate } from "../../utils/formatters";
import { LiveCampusPulse } from "../common/LiveCampusPulse";

export function FacultyOverviewTab({
  user,
  nextLecture,
  totalClasses,
  onGenerateQR,
  onNavigateTab,
  assignedSubjectsCount,
  assignedSubjectsList = [],
}) {
  return (
    <div className="space-y-8">
      {/* Live Campus Pulse Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <LiveCampusPulse statusText="Faculty Terminal Online" activeCount={totalClasses || 3} />
        <span className="font-mono text-xs text-[#6B7280]">
          INSTITUTION TIER: <strong className="text-[#9E3D24]">PROFESSOR & INSTRUCTOR WORKSPACE</strong>
        </span>
      </div>

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#D8D2C4] pb-6">
        <div>
          <span className="text-xs uppercase font-bold text-[#9E3D24] font-mono tracking-wider">
            Faculty Academic Workspace
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#12181F] font-bold mt-1">
            Good day, {user?.full_name || "Dr. Faculty"}!
          </h1>
          <p className="text-sm text-[#555E68] mt-1">
            {user?.department || "Academic Department"} • Academic Year 2026-27
          </p>
        </div>
      </div>

      {/* Next Lecture Hero Banner */}
      <div className="bg-[#FBF9F5] border border-[#D8D2C4] rounded p-4 sm:p-6 shadow-xs flex flex-col md:flex-row gap-6 sm:gap-8 justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#9E3D24] text-xs font-mono uppercase font-bold">Upcoming Scheduled Session</span>
            <span className="text-xs text-[#6B7280] font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {nextLecture ? `${nextLecture.start_time} - ${nextLecture.end_time}` : "10:00 AM - 11:30 AM"}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#12181F] font-bold">
            {nextLecture
              ? nextLecture.subject_name
              : assignedSubjectsList[0]?.subject_name || "Academic Timetable Course"}
          </h2>
          <p className="text-sm text-[#555E68] mt-1">
            {nextLecture
              ? `${nextLecture.subject_code} • ${formatShortDate(nextLecture.lecture_date)}`
              : `${assignedSubjectsList[0]?.subject_code || "Workload"} • Timetable Teaching Schedule`}
          </p>
        </div>

        <button
          onClick={() => onGenerateQR(nextLecture?.id)}
          className="w-full sm:w-auto bg-[#9E3D24] text-white py-3 px-8 rounded hover:bg-[#83311C] transition-colors shadow-xs cursor-pointer font-bold text-xs text-center"
        >
          Broadcast Attendance QR
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#D8D2C4] p-4 sm:p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-[#6B7280] font-mono">Classes Conducted</span>
          <div className="font-serif text-3xl sm:text-4xl font-bold text-[#12181F] mt-2">{totalClasses || 3}</div>
          <p className="text-xs text-[#2E6B34] font-semibold mt-1">Syllabus Progress On Track</p>
        </div>

        <div className="bg-white border border-[#D8D2C4] p-4 sm:p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-[#6B7280] font-mono">Average Attendance</span>
          <div className="font-serif text-3xl sm:text-4xl font-bold text-[#12181F] mt-2">92.4%</div>
          <p className="text-xs text-[#2E6B34] font-semibold mt-1">+17.4% Above Cutoff</p>
        </div>

        <div className="bg-white border border-[#D8D2C4] p-4 sm:p-5 rounded shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-[#6B7280] font-mono">Assigned Subjects</span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("courses")}
                  className="text-[11px] text-[#9E3D24] hover:underline font-bold cursor-pointer"
                >
                  View All &rarr;
                </button>
              )}
            </div>
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#12181F] mt-2">
              {assignedSubjectsCount !== undefined ? assignedSubjectsCount : assignedSubjectsList.length}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Winter Semester 2026</p>
          </div>
          {assignedSubjectsList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#E5E7EB]">
              {assignedSubjectsList.slice(0, 4).map((sub) => (
                <span
                  key={sub.id || sub.subject_code}
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#9E3D24]/10 text-[#9E3D24]"
                  title={sub.subject_name}
                >
                  {sub.subject_code}
                </span>
              ))}
              {assignedSubjectsList.length > 4 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  +{assignedSubjectsList.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
