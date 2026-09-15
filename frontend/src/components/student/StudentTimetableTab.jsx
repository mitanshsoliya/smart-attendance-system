import React, { useState, useEffect } from "react";
import {
  PERIOD_SLOTS,
  DEPARTMENT_TIMETABLES,
  getDepartmentTimetable,
  getBatchLabel,
} from "../../data/departmentTimetables";
import { timetableService } from "../../services/timetableService";

export function StudentTimetableTab({ user, token }) {
  // Determine student's enrolled department strictly from user profile (no switching allowed)
  const userDept =
    user?.department ||
    user?.profile?.department ||
    user?.student_profile?.department ||
    "Department of Computer Science & Engineering";

  const selectedDeptKey =
    userDept.includes("Information") || userDept.includes("IT")
      ? "Department of Information Technology"
      : userDept.includes("Electronics") || userDept.includes("ECE")
      ? "Department of Electronics & Communication"
      : "Department of Computer Science & Engineering";

  // Live fetched timetable state
  const [liveTimetable, setLiveTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch live schedule from DB strictly for the student's own department
  useEffect(() => {
    let isMounted = true;
    const fetchLive = async () => {
      try {
        setLoading(true);
        const data = await timetableService.getTimetable(token, selectedDeptKey);
        if (isMounted && data && data.schedule) {
          setLiveTimetable(data.schedule);
        }
      } catch (e) {
        console.error("Failed to load live student timetable:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLive();
    return () => {
      isMounted = false;
    };
  }, [selectedDeptKey, token]);

  // Determine initial section (Sec A, Sec B, Sec C)
  const userSectionInfo = getBatchLabel(user?.profile?.section || "Sec A");
  const [activeSectionFilter, setActiveSectionFilter] = useState(userSectionInfo.section); // "All", "Sec A", "Sec B", "Sec C"
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" (Official Matrix) or "mySection" (Individual schedule)

  const currentTimetable =
    liveTimetable ||
    DEPARTMENT_TIMETABLES[selectedDeptKey] ||
    DEPARTMENT_TIMETABLES["Department of Computer Science & Engineering"];

  const sections = [
    { key: "All", label: "All Sections (Sec A, B, C)" },
    { key: "Sec A", label: "Sec A" },
    { key: "Sec B", label: "Sec B" },
    { key: "Sec C", label: "Sec C" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-bright border border-border-default rounded p-4 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">event_available</span>
            <h1 className="font-serif-display text-2xl text-primary font-bold">Academic Class Time Table</h1>
          </div>
          <p className="text-xs text-text-stone mt-1">
            Official Winter 2026 weekly academic lecture, laboratory, and tutorial schedule for your department.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Enrolled Department Display (Strictly Locked to Student's Department) */}
          <div className="flex items-center gap-2 bg-surface-container-low border border-border-default rounded px-3 py-2 text-xs">
            <span className="material-symbols-outlined text-secondary text-base">school</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Your Department</span>
              <span className="font-bold text-primary">
                {currentTimetable?.deptFullName || selectedDeptKey}
              </span>
            </div>
            <span className="ml-1 text-[11px] font-mono font-bold text-primary bg-surface-container px-2 py-0.5 rounded">
              Room {currentTimetable?.roomNo || "503"}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded border border-border-default bg-surface-container-low p-1 text-xs">
            <button
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1 font-semibold rounded transition-all flex items-center gap-1.5 ${
                viewMode === "matrix"
                  ? "bg-surface-container-highest text-primary font-bold shadow-xs"
                  : "text-text-stone hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_on</span>
              Official Matrix
            </button>
            <button
              onClick={() => setViewMode("mySection")}
              className={`px-3 py-1 font-semibold rounded transition-all flex items-center gap-1.5 ${
                viewMode === "mySection"
                  ? "bg-surface-container-highest text-primary font-bold shadow-xs"
                  : "text-text-stone hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-sm">person</span>
              My Section Schedule
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-surface-container-low border border-border-default rounded hover:bg-surface-container-high transition-colors"
            title="Print or Export Timetable"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low border border-border-default rounded px-4 py-3 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-text-stone font-semibold">Filter Section:</span>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((sec) => {
              const isUserSec = userSectionInfo.section === sec.key;
              const isSelected = activeSectionFilter === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSectionFilter(sec.key)}
                  className={`px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-primary text-surface-lowest border-primary shadow-xs"
                      : "bg-surface-bright text-text-stone border-border-default hover:text-primary hover:border-text-stone"
                  }`}
                >
                  <span>{sec.label}</span>
                  {isUserSec && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block ml-0.5" title="Your Assigned Section"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-text-stone flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Your Section: <strong className="text-secondary">{userSectionInfo.section}</strong>
          </span>
          <span>•</span>
          <span>Labs rotate per section allocation</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL BMU CLASS TIME TABLE CARD (Matching the uploaded reference photo) */}
      {/* ========================================================================= */}
      <div className="bg-surface-lowest border-2 border-primary/80 rounded-sm shadow-sm overflow-hidden text-primary print:border-black print:shadow-none">
        {/* Document Header Table */}
        <div className="border-b-2 border-primary/80">
          {/* Top Row: Meta info left, Center University Title, Doc info right */}
          <div className="grid grid-cols-12 text-[11px] font-sans">
            {/* Left Box: Term, Semester, Class, Room */}
            <div className="col-span-3 border-r-2 border-primary/80 divide-y divide-primary/70">
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Term:</span>
                <span className="font-bold">{currentTimetable.term}</span>
              </div>
              <div className="px-2.5 py-1 text-center font-bold bg-surface-container-low/50">
                {currentTimetable.effectiveFrom}
              </div>
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Semester:</span>
                <span className="font-bold">{currentTimetable.semester}</span>
              </div>
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Class:</span>
                <span className="font-bold">{currentTimetable.class}</span>
              </div>
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Room No.:</span>
                <span className="font-bold font-mono text-secondary">{currentTimetable.roomNo}</span>
              </div>
            </div>

            {/* Center Box: BMU Logo & Department Title */}
            <div className="col-span-6 flex flex-col items-center justify-center p-3 text-center border-r-2 border-primary/80 bg-surface-lowest">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded bg-[#002b49] text-white flex flex-col items-center justify-center font-serif font-black shadow-xs border border-amber-400/40">
                  <span className="text-[10px] tracking-wider leading-none text-amber-300">BMU</span>
                  <span className="material-symbols-outlined text-[14px] leading-none mt-0.5 text-white">school</span>
                </div>
                <div className="text-left">
                  <h2 className="font-serif-display text-base tracking-wider font-extrabold text-primary uppercase">
                    {currentTimetable.facultyName}
                  </h2>
                  <h3 className="font-sans text-xs tracking-widest font-black text-secondary uppercase">
                    CLASS TIME TABLE
                  </h3>
                </div>
              </div>
              <div className="mt-1 text-[11px] font-extrabold tracking-wide uppercase px-3 py-0.5 border-t border-b border-primary/30 w-full text-center">
                {currentTimetable.deptFullName}
              </div>
            </div>

            {/* Right Box: Doc No, Effective Date, Rev No, Issue No */}
            <div className="col-span-3 divide-y divide-primary/70 text-[11px]">
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Doc No.:</span>
                <span className="font-mono text-[10px]">{currentTimetable.docNo}</span>
              </div>
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold">Effective From:</span>
                <span className="font-semibold">{currentTimetable.effectiveFrom}</span>
              </div>
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Revision No.</span>
                <span className="font-bold font-mono">{currentTimetable.revisionNo}</span>
              </div>
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold italic">Issue No.</span>
                <span className="font-bold font-mono">{currentTimetable.issueNo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Matrix Table */}
        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-center border-collapse text-xs min-w-[720px]">
            <thead>
              {/* Row 1: Period Numbers */}
              <tr className="border-b-2 border-primary/80 font-bold bg-surface-container-low/80 text-[11px]">
                <th className="border-r-2 border-primary/80 p-2 w-28 text-left font-bold">Period</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">1</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">2</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">3</th>
                <th className="border-r border-primary/80 p-2 w-[11%]">4</th>
                <th className="border-r-2 border-primary/80 p-2 w-20 bg-surface-container-high/60 text-[10px] font-extrabold uppercase">
                  01:00 TO 01:30
                </th>
                <th className="border-r border-primary/70 p-2 w-[11%]">5</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">6</th>
                <th className="p-2 w-[11%]">7</th>
              </tr>

              {/* Row 2: Clock Times */}
              <tr className="border-b-2 border-primary/80 font-bold bg-surface-lowest text-[10px]">
                <th className="border-r-2 border-primary/80 p-1.5 text-left font-bold italic">Day / Time</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">9:00 TO 10:00</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">10:00 TO 11:00</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">11:00 TO 12:00</th>
                <th className="border-r border-primary/80 p-1.5 font-mono">12:00 TO 1:00</th>
                <th className="border-r-2 border-primary/80 p-1.5 bg-surface-container-high/60 text-[9px] font-bold text-text-stone uppercase">
                  LUNCH BREAK
                </th>
                <th className="border-r border-primary/70 p-1.5 font-mono">1:30 TO 2:20</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">2:20 TO 3:10</th>
                <th className="p-1.5 font-mono">3:10 TO 4.00</th>
              </tr>
            </thead>

            <tbody className="divide-y-2 divide-primary/80 font-medium">
              {/* ======================= MONDAY ======================= */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="border-r-2 border-primary/80 p-2.5 font-bold text-left bg-surface-container-low/40">
                  Monday
                </td>
                {/* P1: DDSP (ST) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Monday.p1, activeSectionFilter)}
                </td>
                {/* P2: PS (RM) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Monday.p2, activeSectionFilter)}
                </td>
                {/* P3 & P4 Combined Lab Block: ETC / DS / DLMA */}
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Monday.lab1, activeSectionFilter, viewMode)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30 p-1 text-[9px] font-mono text-text-stone">
                  {/* Lunch column empty in schedule, span covers it */}
                </td>
                {/* P5: DLMA (RG) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Monday.p5, activeSectionFilter)}
                </td>
                {/* P6 & P7 Combined Lab Block: PY Lab for all 3 batches */}
                <td colSpan={2} className="p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Monday.lab2, activeSectionFilter, viewMode)}
                </td>
              </tr>

              {/* ======================= TUESDAY ======================= */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="border-r-2 border-primary/80 p-2.5 font-bold text-left bg-surface-container-low/40">
                  Tuesday
                </td>
                {/* P1: IC (KT) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Tuesday.p1, activeSectionFilter)}
                </td>
                {/* P2: PS (RM) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Tuesday.p2, activeSectionFilter)}
                </td>
                {/* P3 & P4 Combined Lab Block: PY Labs */}
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Tuesday.lab1, activeSectionFilter, viewMode)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30 p-1 text-[9px] font-mono text-text-stone"></td>
                {/* P5 & P6 Combined Lab Block: DDSP / DS / ETC */}
                <td colSpan={2} className="border-r border-primary/70 p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Tuesday.lab2, activeSectionFilter, viewMode)}
                </td>
                {/* P7: DDSP (ST) */}
                <td className="p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Tuesday.p7, activeSectionFilter)}
                </td>
              </tr>

              {/* ======================= WEDNESDAY ======================= */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="border-r-2 border-primary/80 p-2.5 font-bold text-left bg-surface-container-low/40">
                  Wednesday
                </td>
                {/* P1: ETC (MTS) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Wednesday.p1, activeSectionFilter)}
                </td>
                {/* P2: DS (VP) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Wednesday.p2, activeSectionFilter)}
                </td>
                {/* P3 & P4 Combined Lab Block: DLMA / DDSP / DS */}
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Wednesday.lab1, activeSectionFilter, viewMode)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30 p-1 text-[9px] font-mono text-text-stone"></td>
                {/* P5: DDSP (ST) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Wednesday.p5, activeSectionFilter)}
                </td>
                {/* P6: PS (RM) T */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Wednesday.p6, activeSectionFilter)}
                </td>
                {/* P7: LIBRARY */}
                <td className="p-2 font-extrabold text-text-stone tracking-wide">
                  {renderLectureCell(currentTimetable.days.Wednesday.p7, activeSectionFilter)}
                </td>
              </tr>

              {/* ======================= THURSDAY ======================= */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="border-r-2 border-primary/80 p-2.5 font-bold text-left bg-surface-container-low/40">
                  Thursday
                </td>
                {/* P1 & P2 Combined Lab Block: DS / DLMA / DDSP */}
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Thursday.lab1, activeSectionFilter, viewMode)}
                </td>
                {/* P3: DLMA (RG) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Thursday.p3, activeSectionFilter)}
                </td>
                {/* P4: ETC (MTS) */}
                <td className="border-r-2 border-primary/80 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Thursday.p4, activeSectionFilter)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30 p-1 text-[9px] font-mono text-text-stone"></td>
                {/* P5: PS (RM) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Thursday.p5, activeSectionFilter)}
                </td>
                {/* P6: DS (VP) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Thursday.p6, activeSectionFilter)}
                </td>
                {/* P7: LIBRARY */}
                <td className="p-2 font-extrabold text-text-stone tracking-wide">
                  {renderLectureCell(currentTimetable.days.Thursday.p7, activeSectionFilter)}
                </td>
              </tr>

              {/* ======================= FRIDAY ======================= */}
              <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="border-r-2 border-primary/80 p-2.5 font-bold text-left bg-surface-container-low/40">
                  Friday
                </td>
                {/* P1: DDSP (ST) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Friday.p1, activeSectionFilter)}
                </td>
                {/* P2: DLMA (RG) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Friday.p2, activeSectionFilter)}
                </td>
                {/* P3: PS (RM) */}
                <td className="border-r border-primary/70 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Friday.p3, activeSectionFilter)}
                </td>
                {/* P4: IC (KT) */}
                <td className="border-r-2 border-primary/80 p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Friday.p4, activeSectionFilter)}
                </td>
                {/* LUNCH */}
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30 p-1 text-[9px] font-mono text-text-stone"></td>
                {/* P5 & P6 Combined Lab Block: DS / ETC / DS */}
                <td colSpan={2} className="border-r border-primary/70 p-1 bg-surface-container-low/20">
                  {renderLabBlock(currentTimetable.days.Friday.lab2, activeSectionFilter, viewMode)}
                </td>
                {/* P7: DS (VP) */}
                <td className="p-2 font-bold text-primary">
                  {renderLectureCell(currentTimetable.days.Friday.p7, activeSectionFilter)}
                </td>
              </tr>

              {/* ======================= SATURDAY ======================= */}
              <tr className="bg-surface-container-low/10">
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left text-text-stone bg-surface-container-low/30">
                  Saturday
                </td>
                <td colSpan={8} className="p-3 text-center text-text-muted text-[11px] font-semibold italic">
                  {currentTimetable.days.Saturday.text}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REFERENCE LEGENDS: SUBJECT & FACULTY DIRECTORY */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Course Catalog Reference */}
        <div className="bg-surface-bright border border-border-default rounded p-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border-default pb-2 mb-3">
            <span className="material-symbols-outlined text-secondary text-base">menu_book</span>
            <h4 className="font-bold text-sm text-primary">Course Catalog & Nomenclature</h4>
          </div>
          <div className="divide-y divide-border-default text-xs">
            {currentTimetable.subjectDirectory.map((sub) => (
              <div key={sub.code} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-secondary bg-surface-container px-1.5 py-0.5 rounded text-[11px]">
                    {sub.code}
                  </span>
                  <span className="font-medium text-primary">{sub.name}</span>
                </div>
                <span className="text-[10px] text-text-stone font-semibold shrink-0">
                  {sub.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty Reference */}
        <div className="bg-surface-bright border border-border-default rounded p-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border-default pb-2 mb-3">
            <span className="material-symbols-outlined text-secondary text-base">badge</span>
            <h4 className="font-bold text-sm text-primary">Faculty Code Directory</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentTimetable.facultyDirectory.map((fac) => (
              <div key={fac.code} className="p-2 bg-surface-container-low border border-border-default rounded flex items-start gap-2">
                <span className="font-mono font-bold text-primary bg-surface-container px-1.5 py-0.5 rounded text-[11px] shrink-0">
                  {fac.code}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-primary truncate">{fac.name}</div>
                  <div className="text-[10px] text-text-stone truncate">{fac.subject}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to render individual theory/tutorial/library lecture cell with ultra-high contrast
 */
function renderLectureCell(cell, activeSection) {
  if (!cell) return <span className="text-[#94A3B8] font-bold">—</span>;

  const isLibrary = cell.type === "library";
  const isTutorial = cell.type === "tutorial";

  return (
    <div className="py-1 text-center">
      <span
        className={`block text-xs font-black tracking-tight ${
          isLibrary ? "text-[#0F172A] font-black uppercase" : "text-[#0F172A]"
        }`}
      >
        {cell.title}
      </span>
      {!isLibrary && (
        <span className="text-[10px] font-black text-[#334155] font-mono block mt-0.5">
          Room {cell.room || "503"}
          {isTutorial && (
            <span className="ml-1 text-[#C2410C] font-black uppercase text-[9px]">
              (Tutorial)
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Helper to render 2-Hour rotating lab block with Sec A / B / C breakdown with crisp high contrast
 */
function renderLabBlock(labBlock, activeSection, viewMode) {
  if (!labBlock || !labBlock.batches) return <span className="text-[#94A3B8] font-bold">—</span>;

  // In "mySection" mode, show only the student's selected section if filtered
  if (viewMode === "mySection" && activeSection !== "All") {
    const b = labBlock.batches[activeSection] || labBlock.batches[`Batch A${activeSection === "Sec A" ? "1" : activeSection === "Sec B" ? "2" : "3"}`];
    if (b) {
      return (
        <div className="p-2.5 bg-[#F0FDF4] border-2 border-[#16A34A] rounded-lg text-left shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-[10px] font-black text-white bg-[#15803D] px-2.5 py-0.5 rounded shadow-2xs">
              {activeSection}
            </span>
            <span className="text-xs font-black text-[#0F172A]">
              Venue: <strong className="text-[#14532D] underline">{b.lab}</strong>
            </span>
          </div>
          <div className="font-black text-sm text-[#064E3B] mt-1.5">
            {b.subject} ({b.faculty})
          </div>
          <div className="text-xs font-bold text-[#15803D] mt-0.5">
            2-Hour Practical Session
          </div>
        </div>
      );
    }
  }

  // Official Matrix View (Shows all sections with crisp text)
  return (
    <div className="space-y-1 text-left text-[11px] py-1">
      {Object.entries(labBlock.batches).map(([secKey, b]) => {
        const displaySec = secKey.includes("A1") ? "Sec A" : secKey.includes("A2") ? "Sec B" : secKey.includes("A3") ? "Sec C" : secKey;
        const isSelected = activeSection === displaySec;
        const displayText = (b.text || `${b.subject}- ${b.faculty} (${b.lab})`)
          .replace(/\s*\((?:Sec|Batch)\s*[A-C1-3]\)/gi, "");

        return (
          <div
            key={secKey}
            className={`px-2 py-0.5 rounded transition-colors flex items-center justify-between border ${
              isSelected
                ? "bg-[#F1F5F9] border-2 border-[#CBD5E1] text-[#0F172A] font-black"
                : "bg-white/80 hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] font-bold"
            }`}
          >
            <span className="truncate text-xs">{displayText}</span>
            <span
              className={`text-xs font-mono font-bold ml-1.5 shrink-0 ${
                isSelected ? "text-[#0F172A] font-black" : "text-[#475569]"
              }`}
            >
              {displaySec}
            </span>
          </div>
        );
      })}
    </div>
  );
}
