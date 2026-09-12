import React from "react";
import { formatShortDate } from "../../utils/formatters";
import { LiveCampusPulse } from "../common/LiveCampusPulse";

export function FacultyOverviewTab({ user, nextLecture, totalClasses, onGenerateQR }) {
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
          <h1 className="font-serif text-3xl text-[#12181F] font-bold mt-1">
            Good day, {user?.full_name || "Dr. Faculty"}!
          </h1>
          <p className="text-sm text-[#555E68] mt-1">
            Department of Computer Science & Engineering • Academic Year 2026-27
          </p>
        </div>
      </div>

      {/* Next Lecture Hero Banner */}
      <div className="bg-[#FBF9F5] border border-[#D8D2C4] rounded p-6 shadow-xs flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#9E3D24] text-xs font-mono uppercase font-bold">Upcoming Scheduled Session</span>
            <span className="text-xs text-[#6B7280] font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {nextLecture ? `${nextLecture.start_time} - ${nextLecture.end_time}` : "10:00 AM - 11:30 AM"}
            </span>
          </div>
          <h2 className="font-serif text-3xl text-[#12181F] font-bold">
            {nextLecture ? nextLecture.subject_name : "Database Systems"}
          </h2>
          <p className="text-sm text-[#555E68] mt-1">
            {nextLecture ? `${nextLecture.subject_code} • ${formatShortDate(nextLecture.lecture_date)}` : "CS501 • Lecture Theater 204"}
          </p>
        </div>

        <button
          onClick={() => onGenerateQR(nextLecture?.id)}
          className="bg-[#9E3D24] text-white py-3 px-8 rounded hover:bg-[#83311C] transition-colors shadow-xs cursor-pointer font-bold text-xs"
        >
          Broadcast Attendance QR
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#D8D2C4] p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-[#6B7280] font-mono">Classes Conducted</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-2">{totalClasses || 3}</div>
          <p className="text-xs text-[#2E6B34] font-semibold mt-1">Syllabus Progress On Track</p>
        </div>

        <div className="bg-white border border-[#D8D2C4] p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-[#6B7280] font-mono">Average Attendance</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-2">92.4%</div>
          <p className="text-xs text-[#2E6B34] font-semibold mt-1">+17.4% Above Cutoff</p>
        </div>

        <div className="bg-white border border-[#D8D2C4] p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-[#6B7280] font-mono">Assigned Subjects</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-2">4</div>
          <p className="text-xs text-[#6B7280] mt-1">Fall Semester 2026</p>
        </div>
      </div>
    </div>
  );
}
