import React, { useState } from "react";
import {
  PERIOD_SLOTS,
  DEPARTMENT_TIMETABLES,
  getDepartmentTimetable,
  getBatchLabel,
} from "../../data/departmentTimetables";

export function StudentTimetableTab({ user }) {
  // Determine initial department
  const userDept = user?.department || user?.profile?.department || "Department of Computer Science & Engineering";
  const [selectedDeptKey, setSelectedDeptKey] = useState(
    userDept.includes("Information")
      ? "Department of Information Technology"
      : userDept.includes("Electronics")
      ? "Department of Electronics & Communication"
      : "Department of Computer Science & Engineering"
  );

  // Determine initial section (Sec A -> Batch A1, Sec B -> Batch A2, Sec C -> Batch A3)
  const userSectionInfo = getBatchLabel(user?.profile?.section || "Sec A");
  const [activeSectionFilter, setActiveSectionFilter] = useState(userSectionInfo.section); // "All", "Sec A", "Sec B", "Sec C"
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" (Official Matrix) or "mySection" (Individual schedule)

  const currentTimetable = DEPARTMENT_TIMETABLES[selectedDeptKey] || DEPARTMENT_TIMETABLES["Department of Computer Science & Engineering"];

  const sections = [
    { key: "All", label: "All Batches (A1, A2, A3)", batch: "Full Division" },
    { key: "Sec A", label: "Sec A", batch: "BATCH A1" },
    { key: "Sec B", label: "Sec B", batch: "BATCH A2" },
    { key: "Sec C", label: "Sec C", batch: "BATCH A3" },
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
            Official Winter 2026 weekly academic lecture, laboratory, and tutorial schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container-low border border-border-default rounded px-3 py-1.5">
            <span className="text-xs font-semibold text-text-stone">Department:</span>
            <select
              value={selectedDeptKey}
              onChange={(e) => setSelectedDeptKey(e.target.value)}
              className="text-xs font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Department of Computer Science & Engineering">CSE (Room 503)</option>
              <option value="Department of Information Technology">IT (Room 402)</option>
              <option value="Department of Electronics & Communication">ECE (Room 301)</option>
            </select>
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
          <span className="text-text-stone font-semibold">Filter Batch / Section:</span>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((sec) => {
              const isUserSec = userSectionInfo.section === sec.key;
              const isSelected = activeSectionFilter === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSectionFilter(sec.key)}
                  className={`px-3 py-1 rounded font-bold transition-colors flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-primary text-surface-lowest border-primary shadow-xs"
                      : "bg-surface-bright text-text-stone border-border-default hover:text-primary hover:border-text-stone"
                  }`}
                >
                  <span>{sec.label}</span>
                  {sec.batch !== "Full Division" && (
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? "bg-white/20 text-white" : "bg-surface-container text-text-muted"
                      }`}
                    >
                      {sec.batch}
                    </span>
                  )}
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
            Your Section: <strong className="text-secondary">{userSectionInfo.section} ({userSectionInfo.batch})</strong>
          </span>
          <span>•</span>
          <span>Labs rotate per batch allocation</span>
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
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
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
 * Helper to render individual theory/tutorial/library lecture cell
 */
function renderLectureCell(cell, activeSection) {
  if (!cell) return <span>-</span>;

  const isLibrary = cell.type === "library";
  const isTutorial = cell.type === "tutorial";

  return (
    <div className="py-1">
      <span className={`block tracking-tight text-[11px] ${isLibrary ? "font-black text-text-stone" : "font-bold text-primary"}`}>
        {cell.title}
      </span>
      {!isLibrary && (
        <span className="text-[9px] text-text-stone font-mono block mt-0.5">
          Room {cell.room}
          {isTutorial && <span className="ml-1 text-secondary font-bold">(Tutorial)</span>}
        </span>
      )}
    </div>
  );
}

/**
 * Helper to render 2-Hour rotating lab block with Batch A1 / A2 / A3 breakdown
 */
function renderLabBlock(labBlock, activeSection, viewMode) {
  if (!labBlock || !labBlock.batches) return <span>-</span>;

  // In "mySection" mode, show only the student's selected section if filtered
  if (viewMode === "mySection" && activeSection !== "All" && labBlock.batches[activeSection]) {
    const b = labBlock.batches[activeSection];
    return (
      <div className="p-2 bg-secondary-container/10 border-2 border-secondary/60 rounded text-left">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[10px] font-extrabold text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 rounded">
            {b.batch} ({activeSection})
          </span>
          <span className="text-[10px] font-bold text-primary">{b.lab}</span>
        </div>
        <div className="font-bold text-xs text-primary mt-1">
          {b.subject} ({b.faculty})
        </div>
        <div className="text-[10px] text-text-stone mt-0.5">
          2-Hour Practical Session
        </div>
      </div>
    );
  }

  // Official Matrix View (Shows all 3 Batches with highlighting for activeSection)
  return (
    <div className="space-y-0.5 text-left text-[10.5px] py-1">
      {Object.entries(labBlock.batches).map(([secKey, b]) => {
        const isSelected = activeSection === secKey;
        return (
          <div
            key={secKey}
            className={`px-1.5 py-0.5 rounded font-medium transition-colors flex items-center justify-between ${
              isSelected
                ? "bg-secondary-fixed/50 border border-secondary text-primary font-bold shadow-2xs"
                : "hover:bg-surface-container-high/60 text-primary"
            }`}
          >
            <span className="truncate">{b.text}</span>
            <span
              className={`text-[9px] font-mono px-1 rounded ml-1 shrink-0 ${
                isSelected ? "bg-secondary text-white font-bold" : "text-text-stone"
              }`}
            >
              {secKey}
            </span>
          </div>
        );
      })}
    </div>
  );
}
