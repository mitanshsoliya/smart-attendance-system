import React, { useState, useEffect } from "react";
import { timetableService } from "../../services/timetableService";
import { getDepartmentTimetable } from "../../data/departmentTimetables";

export function FacultyScheduleTab({ user, token }) {
  const facultyDept =
    user?.department ||
    user?.profile?.department ||
    "Department of Computer Science & Engineering";

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyCode, setSelectedFacultyCode] = useState("");

  // Fetch live timetable from database
  useEffect(() => {
    let isMounted = true;
    const loadTimetable = async () => {
      try {
        setLoading(true);
        const data = await timetableService.getTimetable(token, facultyDept);
        if (isMounted) {
          const sched = data?.schedule || getDepartmentTimetable(facultyDept);
          setTimetable(sched);

          // Auto-detect faculty code from user's full name or email
          const directory = sched.facultyDirectory || [];
          const userEmail = (user?.email || "").toLowerCase();
          const userName = (user?.full_name || "").toLowerCase();

          const found = directory.find(
            (f) =>
              (f.email && userEmail.includes(f.email.toLowerCase())) ||
              (f.name && userName.includes(f.name.toLowerCase().replace("dr. ", "").replace("prof. ", ""))) ||
              userEmail.includes(f.code.toLowerCase())
          );

          if (found) {
            setSelectedFacultyCode(found.code);
          } else if (directory.length > 0) {
            setSelectedFacultyCode(directory[0].code);
          }
        }
      } catch (err) {
        console.error("Failed to load faculty timetable:", err);
        if (isMounted) {
          const fallback = getDepartmentTimetable(facultyDept);
          setTimetable(fallback);
          if (fallback.facultyDirectory?.length > 0) {
            setSelectedFacultyCode(fallback.facultyDirectory[0].code);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTimetable();
    return () => {
      isMounted = false;
    };
  }, [facultyDept, token, user]);

  const current = timetable || getDepartmentTimetable(facultyDept);
  const directory = current.facultyDirectory || [];
  const activeFaculty = directory.find((f) => f.code === selectedFacultyCode) || directory[0] || {
    code: selectedFacultyCode || "ST",
    name: user?.full_name || "Faculty Member",
    subject: "Academic Instructor",
  };

  // Calculate faculty-specific metrics
  let totalLectures = 0;
  let totalLabs = 0;

  if (current?.days) {
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach((dayName) => {
      const day = current.days[dayName];
      if (!day) return;

      // Theory slots
      ["p1", "p2", "p3", "p4", "p5", "p6", "p7"].forEach((slotKey) => {
        const slot = day[slotKey];
        if (slot && slot.faculty === activeFaculty.code) {
          totalLectures += 1;
        }
      });

      // Lab 1
      if (day.lab1?.batches) {
        const hasLab1 = Object.values(day.lab1.batches).some((b) => b.faculty === activeFaculty.code);
        if (hasLab1) totalLabs += 1;
      }

      // Lab 2
      if (day.lab2?.batches) {
        const hasLab2 = Object.values(day.lab2.batches).some((b) => b.faculty === activeFaculty.code);
        if (hasLab2) totalLabs += 1;
      }
    });
  }

  const totalWeeklyHours = totalLectures * 1 + totalLabs * 2;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Banner & Faculty Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#CBD5E1] rounded-lg p-5 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C2410C] text-2xl font-bold">schedule</span>
            <h1 className="font-serif text-2xl text-[#0F172A] font-extrabold tracking-tight">
              Individual Faculty Teaching Schedule
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#475569] mt-1">
            Personalized weekly timetable showing strictly your assigned lectures and laboratories. All other period slots are kept clear.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Faculty Code Selector */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-lg px-3 py-2 text-xs">
            <span className="font-extrabold text-[#334155]">Active Instructor:</span>
            <select
              value={selectedFacultyCode}
              onChange={(e) => setSelectedFacultyCode(e.target.value)}
              className="font-black text-[#0F172A] bg-transparent focus:outline-none cursor-pointer text-xs"
            >
              {directory.map((f) => (
                <option key={f.code} value={f.code} className="text-[#0F172A] font-bold">
                  [{f.code}] {f.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-[#0F172A] bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-lg hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">print</span>
            Print Schedule
          </button>
        </div>
      </div>

      {/* Workload Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 bg-white border-2 border-[#E2E8F0] rounded-lg shadow-xs">
          <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold tracking-wider">
            Faculty Member
          </span>
          <div className="font-extrabold text-sm text-[#0F172A] mt-1 truncate">
            {activeFaculty.name}
          </div>
          <span className="text-xs font-black text-[#C2410C] block mt-0.5">
            Initials Code: [{activeFaculty.code}]
          </span>
        </div>

        <div className="p-4 bg-white border-2 border-[#E2E8F0] rounded-lg shadow-xs">
          <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold tracking-wider">
            Weekly Teaching Hours
          </span>
          <div className="font-serif text-3xl font-extrabold text-[#0F172A] mt-1">
            {totalWeeklyHours} <span className="text-xs font-bold text-[#64748B]">Hrs/Week</span>
          </div>
          <span className="text-[11px] font-bold text-[#15803D]">Fully Accredited</span>
        </div>

        <div className="p-4 bg-white border-2 border-[#E2E8F0] rounded-lg shadow-xs">
          <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold tracking-wider">
            Theory Lectures
          </span>
          <div className="font-serif text-3xl font-extrabold text-[#C2410C] mt-1">
            {totalLectures} <span className="text-xs font-bold text-[#64748B]">Slots</span>
          </div>
          <span className="text-[11px] font-bold text-[#334155]">Classroom: Room {current.roomNo}</span>
        </div>

        <div className="p-4 bg-white border-2 border-[#E2E8F0] rounded-lg shadow-xs">
          <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold tracking-wider">
            Practical Labs
          </span>
          <div className="font-serif text-3xl font-extrabold text-[#15803D] mt-1">
            {totalLabs} <span className="text-xs font-bold text-[#64748B]">Sessions (2-Hr)</span>
          </div>
          <span className="text-[11px] font-bold text-[#334155]">Section Allocations</span>
        </div>
      </div>

      {/* Official Matrix Grid */}
      <div className="bg-white border-2 border-[#0F172A] rounded-md shadow-md overflow-hidden text-[#0F172A] print:border-black">
        {/* Document Header */}
        <div className="grid grid-cols-12 border-b-2 border-[#0F172A] text-[11px] font-sans">
          <div className="col-span-3 border-r-2 border-[#0F172A] divide-y divide-[#0F172A]/70">
            <div className="px-3 py-1.5 flex justify-between bg-[#F8FAFC]">
              <span className="font-bold italic">Term:</span>
              <span className="font-extrabold">{current.term}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Faculty Member:</span>
              <span className="font-black font-mono text-[#C2410C] text-xs">
                [{activeFaculty.code}] {activeFaculty.name}
              </span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Semester / Class:</span>
              <span className="font-extrabold">{current.semester} ({current.class})</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Classroom Room:</span>
              <span className="font-black font-mono text-[#0F172A]">Room {current.roomNo}</span>
            </div>
          </div>

          <div className="col-span-6 flex flex-col items-center justify-center p-3 text-center border-r-2 border-[#0F172A] bg-white">
            <h2 className="font-serif text-base tracking-wider font-extrabold text-[#0F172A] uppercase">
              {current.facultyName}
            </h2>
            <h3 className="font-sans text-xs tracking-widest font-black text-[#C2410C] uppercase mt-0.5">
              FACULTY INDIVIDUAL TEACHING SCHEDULE
            </h3>
            <div className="mt-1.5 text-[11px] font-black tracking-wide uppercase px-3 py-0.5 border-t-2 border-b-2 border-[#0F172A]/30 w-full text-center text-[#1E293B]">
              {activeFaculty.name} • {current.deptFullName}
            </div>
          </div>

          <div className="col-span-3 divide-y divide-[#0F172A]/70 text-[11px]">
            <div className="px-3 py-1.5 flex justify-between bg-[#F8FAFC]">
              <span className="font-bold italic">Doc No.:</span>
              <span className="font-mono text-[10px] font-bold">{current.docNo}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold">Weekly Teaching Load:</span>
              <span className="font-black text-[#0F172A]">{totalWeeklyHours} Hours</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Lectures / Labs:</span>
              <span className="font-black text-[#0F172A]">{totalLectures} Theory / {totalLabs} Lab</span>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-center border-collapse text-xs min-w-[720px]">
            <thead>
              <tr className="border-b-2 border-[#0F172A] font-extrabold bg-[#F1F5F9] text-[11px] text-[#0F172A]">
                <th className="border-r-2 border-[#0F172A] p-2.5 w-28 text-left font-black">Period</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">1</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">2</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">3</th>
                <th className="border-r-2 border-[#0F172A] p-2.5 w-[11%]">4</th>
                <th className="border-r-2 border-[#0F172A] p-2.5 w-20 bg-[#E2E8F0] text-[10px] font-black uppercase tracking-wider text-[#334155]">
                  01:00 - 01:30
                </th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">5</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">6</th>
                <th className="p-2.5 w-[11%]">7</th>
              </tr>
              <tr className="border-b-2 border-[#0F172A] font-bold bg-white text-[10px] text-[#334155]">
                <th className="border-r-2 border-[#0F172A] p-2 text-left italic font-bold">Day / Time</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">9:00 TO 10:00</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">10:00 TO 11:00</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">11:00 TO 12:00</th>
                <th className="border-r-2 border-[#0F172A] p-2 font-mono">12:00 TO 1:00</th>
                <th className="border-r-2 border-[#0F172A] p-2 bg-[#E2E8F0] text-[9px] font-black text-[#475569] uppercase">
                  LUNCH BREAK
                </th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">1:30 TO 2:20</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">2:20 TO 3:10</th>
                <th className="p-2 font-mono">3:10 TO 4.00</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0F172A] font-medium">
              {/* ================= MONDAY ================= */}
              <tr>
                <td className="border-r-2 border-[#0F172A] p-3 font-black text-left bg-[#F8FAFC]">
                  Monday
                </td>
                {/* P1 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Monday?.p1, activeFaculty.code)}
                </td>
                {/* P2 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Monday?.p2, activeFaculty.code)}
                </td>
                {/* P3 & P4: Lab 1 (11:00 - 1:00) */}
                <td colSpan={2} className="border-r-2 border-[#0F172A] p-1.5">
                  {renderFacultyMatchingLab(current.days?.Monday?.lab1, activeFaculty.code)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-[#0F172A] bg-[#F1F5F9]"></td>
                {/* P5 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Monday?.p5, activeFaculty.code)}
                </td>
                {/* P6 & P7: Lab 2 (2:20 - 4:00) */}
                <td colSpan={2} className="p-1.5">
                  {renderFacultyMatchingLab(current.days?.Monday?.lab2, activeFaculty.code)}
                </td>
              </tr>

              {/* ================= TUESDAY ================= */}
              <tr>
                <td className="border-r-2 border-[#0F172A] p-3 font-black text-left bg-[#F8FAFC]">
                  Tuesday
                </td>
                {/* P1 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Tuesday?.p1, activeFaculty.code)}
                </td>
                {/* P2 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Tuesday?.p2, activeFaculty.code)}
                </td>
                {/* P3 & P4: Lab 1 (11:00 - 1:00) */}
                <td colSpan={2} className="border-r-2 border-[#0F172A] p-1.5">
                  {renderFacultyMatchingLab(current.days?.Tuesday?.lab1, activeFaculty.code)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-[#0F172A] bg-[#F1F5F9]"></td>
                {/* P5 & P6: Lab 2 (1:30 - 3:10) */}
                <td colSpan={2} className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingLab(current.days?.Tuesday?.lab2, activeFaculty.code)}
                </td>
                {/* P7 */}
                <td className="p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Tuesday?.p7, activeFaculty.code)}
                </td>
              </tr>

              {/* ================= WEDNESDAY ================= */}
              <tr>
                <td className="border-r-2 border-[#0F172A] p-3 font-black text-left bg-[#F8FAFC]">
                  Wednesday
                </td>
                {/* P1 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Wednesday?.p1, activeFaculty.code)}
                </td>
                {/* P2 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Wednesday?.p2, activeFaculty.code)}
                </td>
                {/* P3 & P4: Lab 1 (11:00 - 1:00) */}
                <td colSpan={2} className="border-r-2 border-[#0F172A] p-1.5">
                  {renderFacultyMatchingLab(current.days?.Wednesday?.lab1, activeFaculty.code)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-[#0F172A] bg-[#F1F5F9]"></td>
                {/* P5 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Wednesday?.p5, activeFaculty.code)}
                </td>
                {/* P6 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Wednesday?.p6, activeFaculty.code)}
                </td>
                {/* P7 */}
                <td className="p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Wednesday?.p7, activeFaculty.code)}
                </td>
              </tr>

              {/* ================= THURSDAY ================= */}
              <tr>
                <td className="border-r-2 border-[#0F172A] p-3 font-black text-left bg-[#F8FAFC]">
                  Thursday
                </td>
                {/* P1 & P2: Lab 1 (9:00 - 11:00) */}
                <td colSpan={2} className="border-r-2 border-[#0F172A] p-1.5">
                  {renderFacultyMatchingLab(current.days?.Thursday?.lab1, activeFaculty.code)}
                </td>
                {/* P3 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Thursday?.p3, activeFaculty.code)}
                </td>
                {/* P4 */}
                <td className="border-r-2 border-[#0F172A] p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Thursday?.p4, activeFaculty.code)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-[#0F172A] bg-[#F1F5F9]"></td>
                {/* P5 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Thursday?.p5, activeFaculty.code)}
                </td>
                {/* P6 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Thursday?.p6, activeFaculty.code)}
                </td>
                {/* P7 */}
                <td className="p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Thursday?.p7, activeFaculty.code)}
                </td>
              </tr>

              {/* ================= FRIDAY ================= */}
              <tr>
                <td className="border-r-2 border-[#0F172A] p-3 font-black text-left bg-[#F8FAFC]">
                  Friday
                </td>
                {/* P1 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Friday?.p1, activeFaculty.code)}
                </td>
                {/* P2 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Friday?.p2, activeFaculty.code)}
                </td>
                {/* P3 */}
                <td className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Friday?.p3, activeFaculty.code)}
                </td>
                {/* P4 */}
                <td className="border-r-2 border-[#0F172A] p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Friday?.p4, activeFaculty.code)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-[#0F172A] bg-[#F1F5F9]"></td>
                {/* P5 & P6: Lab 2 (1:30 - 3:10) */}
                <td colSpan={2} className="border-r border-[#0F172A]/70 p-1.5">
                  {renderFacultyMatchingLab(current.days?.Friday?.lab2, activeFaculty.code)}
                </td>
                {/* P7 */}
                <td className="p-1.5">
                  {renderFacultyMatchingTheory(current.days?.Friday?.p7, activeFaculty.code)}
                </td>
              </tr>

              {/* ================= SATURDAY ================= */}
              <tr className="bg-[#F8FAFC]">
                <td className="border-r-2 border-[#0F172A] p-2.5 font-bold text-left text-[#64748B]">
                  Saturday
                </td>
                <td colSpan={8} className="p-3 text-center text-[#64748B] italic font-semibold text-xs">
                  Non-instructional Day / Weekend Holiday
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty and Course Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-before-page">
        <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-xs">
          <h4 className="font-extrabold text-sm text-[#0F172A] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C2410C] text-base">badge</span>
            Department Faculty Code Directory
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {directory.map((f) => (
              <div
                key={f.code}
                className={`p-2 rounded border ${
                  f.code === activeFaculty.code
                    ? "bg-[#FFF7ED] border-[#C2410C]/40 font-bold"
                    : "bg-[#F8FAFC] border-[#E2E8F0]"
                }`}
              >
                <span className="font-mono font-bold text-[#C2410C]">[{f.code}]</span> {f.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-xs">
          <h4 className="font-extrabold text-sm text-[#0F172A] mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C2410C] text-base">menu_book</span>
            Curriculum Courses & Nomenclature
          </h4>
          <div className="space-y-1.5 text-xs">
            {(current.subjectDirectory || []).map((s) => (
              <div
                key={s.code}
                className="flex items-center justify-between py-1 border-b border-[#E2E8F0] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0F172A] bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[10px]">
                    {s.code}
                  </span>
                  <span className="text-[#0F172A] font-semibold">{s.name}</span>
                </div>
                <span className="text-[10px] text-[#64748B] font-medium">{s.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders clean, natural timetable text for Theory Lecture without colored highlight boxes
 */
function renderFacultyMatchingTheory(cell, facultyCode) {
  if (!cell || !cell.faculty || cell.faculty !== facultyCode) {
    return (
      <div className="h-12 flex items-center justify-center text-[#CBD5E1] font-bold text-sm select-none">
        —
      </div>
    );
  }

  return (
    <div className="py-2 text-center">
      <span className="block font-black text-xs text-[#0F172A] tracking-tight">
        {cell.title || `${cell.subject} (${cell.faculty})`}
      </span>
      <span className="block text-[10px] font-bold text-[#475569] font-mono mt-0.5">
        Room {cell.room || "503"}
      </span>
    </div>
  );
}

/**
 * Renders clean, natural timetable text for Practical Lab without colored highlight boxes
 */
function renderFacultyMatchingLab(labBlock, facultyCode) {
  if (!labBlock || !labBlock.batches) {
    return (
      <div className="h-12 flex items-center justify-center text-[#CBD5E1] font-bold text-sm select-none">
        —
      </div>
    );
  }

  const matchingBatches = Object.entries(labBlock.batches).filter(
    ([sec, b]) => b.faculty === facultyCode
  );

  if (matchingBatches.length === 0) {
    return (
      <div className="h-12 flex items-center justify-center text-[#CBD5E1] font-bold text-sm select-none">
        —
      </div>
    );
  }

  return (
    <div className="py-1.5 text-center space-y-1">
      {matchingBatches.map(([sec, b]) => {
        const displaySec = sec.includes("A1") ? "Sec A" : sec.includes("A2") ? "Sec B" : sec.includes("A3") ? "Sec C" : sec;
        const displayText = (b.text || `${b.subject}- ${b.faculty} (${b.lab})`)
          .replace(/\s*\((?:Sec|Batch)\s*[A-C1-3]\)/gi, "");

        return (
          <div key={sec}>
            <span className="block font-black text-xs text-[#0F172A]">
              {displayText}
            </span>
            <span className="block text-[10px] font-bold text-[#475569] font-mono mt-0.5">
              {b.lab} • {displaySec}
            </span>
          </div>
        );
      })}
    </div>
  );
}
