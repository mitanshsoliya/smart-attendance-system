import React from "react";
import { AttendanceRing } from "../common/AttendanceRing";
import { LiveCampusPulse } from "../common/LiveCampusPulse";

export function HodOverviewTab({ stats, studentsCount, facultyCount, coursesCount, onExportLedger }) {
  const aggregatePct = stats?.aggregateAttendance || 91.4;

  return (
    <div className="space-y-8">
      {/* Live Campus Pulse Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <LiveCampusPulse statusText="Office of Head of Department • NBA Tier-1 Governance Active" activeCount={coursesCount || 12} />
        <span className="font-mono text-xs text-[#6B7280]">
          STATUTORY CUTOFF: <strong className="text-[#9E3D24]">75.0% MANDATORY</strong>
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border-l-4 border-[#9E3D24] border-t border-r border-b border-[#D8D2C4] rounded-r p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
            EXECUTIVE BRIEFING • AY 2026-27 (FALL TERM)
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Department Operational Readiness & Accreditation Index
          </h1>
          <p className="text-xs text-[#555E68] mt-1 max-w-3xl leading-relaxed">
            The Department of Computer Science & Engineering is operating at{" "}
            <strong className="text-[#2E6B34]">{aggregatePct}% aggregate statutory attendance</strong>. Candidates meeting statutory standards are cleared for hall-ticket issuance under University Ordinance §42.1.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportLedger}
          className="px-4 py-2.5 bg-[#1C242E] hover:bg-[#12181F] text-[#EDE8DF] text-xs font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">file_download</span>
          <span>Export Accreditation CSV</span>
        </button>
      </div>

      {/* Attendance Ring & Institutional KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-[#D8D2C4] p-6 rounded shadow-xs flex flex-col items-center justify-center">
          <AttendanceRing percentage={aggregatePct} size={150} label="Department Average" />
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase">Total Students</span>
            <div className="font-serif text-4xl font-bold text-[#12181F] mt-2">
              {studentsCount || stats?.totalStudents || 142}
            </div>
            <span className="text-[11px] text-[#2E6B34] font-semibold mt-1">Active Academic Cohort</span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase">Total Faculty</span>
            <div className="font-serif text-4xl font-bold text-[#12181F] mt-2">
              {facultyCount || stats?.totalFaculty || 18}
            </div>
            <span className="text-[11px] text-[#736F68] mt-1">Professors & Instructors</span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs flex flex-col justify-between">
            <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase">Accredited Courses</span>
            <div className="font-serif text-4xl font-bold text-[#12181F] mt-2">
              {coursesCount || stats?.totalCourses || 12}
            </div>
            <span className="text-[11px] text-[#736F68] mt-1">Fall Semester 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
