import React from "react";
import { AttendanceRing } from "../common/AttendanceRing";
import { LiveCampusPulse } from "../common/LiveCampusPulse";

export function HodOverviewTab({
  stats,
  studentsCount,
  facultyCount,
  coursesCount,
  onExportLedger,
  onEditTimetable,
  onNavigateTab,
}) {
  const aggregatePct =
    stats?.aggregateAttendance !== undefined ? stats.aggregateAttendance : 88.5;
  const totalStudents =
    studentsCount !== undefined ? studentsCount : stats?.totalStudents || 142;
  const totalFaculty =
    facultyCount !== undefined ? facultyCount : stats?.totalFaculty || 12;
  const totalCourses =
    coursesCount !== undefined ? coursesCount : stats?.totalCourses || 8;
  const departmentName = stats?.department || "Department of Computer Science & Engineering";

  const isCompliant = aggregatePct >= 75;

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                OFFICE OF HEAD OF DEPARTMENT (HOD)
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container text-text-stone">
                NBA Tier-1 Governance Active
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Executive Department Overview & Compliance
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-1 max-w-3xl">
              {departmentName} is operating at{" "}
              <strong className="text-primary font-bold">{aggregatePct}% statutory attendance</strong>. Candidates meeting statutory standards are cleared for hall-ticket issuance under University Ordinance §42.1.
            </p>

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border-default/60 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">domain</span>
                <span>{departmentName}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">calendar_today</span>
                <span>Academic Year 2026-27 (Fall Term)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>Cutoff: 75.0% Mandatory</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onExportLedger}
              className="px-4 py-3 bg-surface-bright border border-border-default hover:bg-surface-container text-primary font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Roster CSV</span>
            </button>
            <button
              type="button"
              onClick={onEditTimetable}
              className="px-5 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
              <span>Edit Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Aggregate Attendance Ring */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <AttendanceRing percentage={aggregatePct} size={90} strokeWidth={9} />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone block">
              Department Ratio
            </span>
            <div className="font-heading text-2xl font-black text-primary mt-0.5">
              {aggregatePct}%
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                isCompliant
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">
                {isCompliant ? "check_circle" : "warning"}
              </span>
              {isCompliant ? "Compliant (≥75%)" : "Condonation Alert"}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Students */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
                Total Enrolled Students
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </span>
            </div>
            <div className="font-heading text-3xl font-black text-primary mt-2">
              {totalStudents}
            </div>
          </div>
          <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            Active Cohort Across 3 Sections
          </div>
        </div>

        {/* KPI 3: Total Faculty */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
                Faculty Members
              </span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </span>
            </div>
            <div className="font-heading text-3xl font-black text-primary mt-2">
              {totalFaculty}
            </div>
          </div>
          <div className="mt-2 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
            Professors & Instructors
          </div>
        </div>

        {/* KPI 4: Accredited Courses */}
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
                Accredited Courses
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
              </span>
            </div>
            <div className="font-heading text-3xl font-black text-primary mt-2">
              {totalCourses}
            </div>
          </div>
          <div className="mt-2 text-[11px] font-medium text-text-stone">
            Curriculum Workload Active
          </div>
        </div>
      </div>

      {/* Visual Charts Grid: Attendance Spline Trend + Section Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Weekly Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-4">
            <div>
              <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">show_chart</span>
                Department Attendance Velocity & Weekly Trajectory
              </h3>
              <p className="text-xs text-text-stone mt-0.5">
                Aggregate daily attendance compliance percentage across all scheduled lectures this week.
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Avg: 89.2% (Weekly)
            </span>
          </div>

          {/* SVG Line / Area Spline Chart */}
          <div className="relative pt-4">
            <svg viewBox="0 0 600 220" className="w-full h-48 sm:h-56 overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#123B73" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#123B73" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="30" x2="580" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x="15" y="34" fontSize="10" fill="#94A3B8" fontFamily="monospace">100%</text>

              <line x1="40" y1="80" x2="580" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x="20" y="84" fontSize="10" fill="#94A3B8" fontFamily="monospace">85%</text>

              {/* 75% Cutoff Reference Line */}
              <line x1="40" y1="125" x2="580" y2="125" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="10" y="129" fontSize="10" fill="#D97706" fontWeight="bold" fontFamily="monospace">75%</text>
              <text x="500" y="121" fontSize="9" fill="#D97706" fontWeight="bold">CUTOFF (75%)</text>

              <line x1="40" y1="175" x2="580" y2="175" stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x="20" y="179" fontSize="10" fill="#94A3B8" fontFamily="monospace">60%</text>

              {/* Area fill */}
              <polygon
                points="70,72 170,55 270,90 370,62 470,45 550,58 550,195 70,195"
                fill="url(#areaGradient)"
              />

              {/* Line path */}
              <polyline
                points="70,72 170,55 270,90 370,62 470,45 550,58"
                fill="none"
                stroke="#123B73"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {[
                { x: 70, y: 72, day: "Mon", val: "88%" },
                { x: 170, y: 55, day: "Tue", val: "92%" },
                { x: 270, y: 90, day: "Wed", val: "82%" },
                { x: 370, y: 62, day: "Thu", val: "90%" },
                { x: 470, y: 45, day: "Fri", val: "94%" },
                { x: 550, y: 58, day: "Sat", val: "91%" },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#FFFFFF" stroke="#123B73" strokeWidth="2.5" />
                  <text x={pt.x} y={pt.y - 10} fontSize="10" fontWeight="bold" fill="#123B73" textAnchor="middle" fontFamily="monospace">
                    {pt.val}
                  </text>
                  <text x={pt.x} y="210" fontSize="11" fill="#64748B" textAnchor="middle" fontWeight="600">
                    {pt.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Right 1 Column: Section-Wise Cohort Attendance */}
        <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-border-default pb-3">
            <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">donut_large</span>
              Section Compliance
            </h3>
            <p className="text-xs text-text-stone mt-0.5">
              Cohort statutory status across allocated sections.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { section: "Section A", pct: 92, students: 48, faculty: "Prof. Sharma" },
              { section: "Section B", pct: 86, students: 46, faculty: "Dr. Patel" },
              { section: "Section C", pct: 88, students: 48, faculty: "Prof. Verma" },
            ].map((sec) => (
              <div key={sec.section} className="p-3 bg-surface-container-low rounded-xl border border-border-default/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-primary text-sm">{sec.section}</span>
                    <span className="text-[11px] text-text-stone block">{sec.students} Students • {sec.faculty}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sec.pct}%
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${sec.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border-default text-center">
            <button
              onClick={() => onNavigateTab && onNavigateTab("students")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Manage Student Sections & Devices &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
