import React from "react";

export function HodOverviewTab({ stats, studentsCount, facultyCount, coursesCount, onExportLedger }) {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border-l-4 border-[#9E3D24] border-t border-r border-b border-[#D8D2C4] rounded-r p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
            EXECUTIVE BRIEFING • AY 2026-27
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Department Operational Readiness & Accreditation Index
          </h1>
          <p className="text-xs text-[#555E68] mt-1 max-w-3xl leading-relaxed">
            The Department of Computer Science & Engineering is currently operating at{" "}
            <strong className="text-[#2E6B34]">{stats?.aggregateAttendance || 91.4}% aggregate statutory attendance</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportLedger}
          className="px-4 py-2.5 bg-[#1C242E] hover:bg-[#12181F] text-[#EDE8DF] text-xs font-bold rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">file_download</span>
          <span>Export Accreditation CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
          <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase block">Aggregate Attendance</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-3">
            {stats?.aggregateAttendance || 91.4}%
          </div>
          <span className="text-[11px] text-[#2E6B34] font-semibold mt-1 block">+16.4% Above 75% Cutoff</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
          <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase block">Total Students</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-3">
            {studentsCount || stats?.totalStudents || 142}
          </div>
          <span className="text-[11px] text-[#736F68] mt-1 block">Active Academic Roster</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
          <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase block">Total Faculty</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-3">
            {facultyCount || stats?.totalFaculty || 18}
          </div>
          <span className="text-[11px] text-[#736F68] mt-1 block">Professors & Instructors</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-5 shadow-xs">
          <span className="text-[#736F68] text-[11px] font-mono font-bold uppercase block">Accredited Courses</span>
          <div className="font-serif text-4xl font-bold text-[#12181F] mt-3">
            {coursesCount || stats?.totalCourses || 12}
          </div>
          <span className="text-[11px] text-[#736F68] mt-1 block">Fall Semester 2026</span>
        </div>
      </div>
    </div>
  );
}
