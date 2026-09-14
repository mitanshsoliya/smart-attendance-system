import React, { useState } from "react";
import { DEPARTMENT_TIMETABLES, PERIOD_SLOTS } from "../../data/departmentTimetables";

export function FacultyScheduleTab({ user }) {
  const facultyDept = user?.department || user?.profile?.department || "Department of Computer Science & Engineering";

  const [selectedDeptKey, setSelectedDeptKey] = useState(
    facultyDept.includes("Information")
      ? "Department of Information Technology"
      : facultyDept.includes("Electronics")
      ? "Department of Electronics & Communication"
      : "Department of Computer Science & Engineering"
  );

  const timetable = DEPARTMENT_TIMETABLES[selectedDeptKey] || DEPARTMENT_TIMETABLES["Department of Computer Science & Engineering"];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4 print:hidden">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Faculty Teaching Schedule</h1>
          <p className="text-sm text-text-stone mt-1">
            Weekly academic lectures, practical laboratory allocations, and room assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-container-low border border-border-default rounded px-3 py-1.5 text-xs">
            <span className="font-semibold text-text-stone">Department:</span>
            <select
              value={selectedDeptKey}
              onChange={(e) => setSelectedDeptKey(e.target.value)}
              className="font-bold text-primary bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Department of Computer Science & Engineering">CSE (Room 503)</option>
              <option value="Department of Information Technology">IT (Room 402)</option>
              <option value="Department of Electronics & Communication">ECE (Room 301)</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-surface-container-low border border-border-default rounded hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print Schedule
          </button>
        </div>
      </div>

      {/* Official Class Time Table Card */}
      <div className="bg-surface-lowest border-2 border-primary/80 rounded-sm shadow-sm overflow-hidden text-primary print:border-black">
        {/* Document Header */}
        <div className="grid grid-cols-12 border-b-2 border-primary/80 text-[11px] font-sans">
          <div className="col-span-3 border-r-2 border-primary/80 divide-y divide-primary/70">
            <div className="px-2 py-1 flex justify-between">
              <span className="font-bold italic">Term:</span>
              <span className="font-bold">{timetable.term}</span>
            </div>
            <div className="px-2 py-1 text-center font-bold bg-surface-container-low/50">
              {timetable.effectiveFrom}
            </div>
            <div className="px-2 py-1 flex justify-between">
              <span className="font-bold italic">Semester:</span>
              <span className="font-bold">{timetable.semester}</span>
            </div>
            <div className="px-2 py-1 flex justify-between">
              <span className="font-bold italic">Room No.:</span>
              <span className="font-bold font-mono text-secondary">{timetable.roomNo}</span>
            </div>
          </div>

          <div className="col-span-6 flex flex-col items-center justify-center p-3 text-center border-r-2 border-primary/80 bg-surface-lowest">
            <h2 className="font-serif-display text-sm tracking-wider font-extrabold text-primary uppercase">
              {timetable.facultyName}
            </h2>
            <h3 className="font-sans text-xs tracking-widest font-black text-secondary uppercase">
              FACULTY TEACHING & CLASS TIME TABLE
            </h3>
            <div className="mt-1 text-[10px] font-extrabold tracking-wide uppercase px-2 py-0.5 border-t border-b border-primary/30 w-full text-center">
              {timetable.deptFullName}
            </div>
          </div>

          <div className="col-span-3 divide-y divide-primary/70 text-[11px]">
            <div className="px-2 py-1 flex justify-between">
              <span className="font-bold italic">Doc No.:</span>
              <span className="font-mono text-[10px]">{timetable.docNo}</span>
            </div>
            <div className="px-2 py-1 flex justify-between">
              <span className="font-bold">Revision No.</span>
              <span className="font-bold font-mono">{timetable.revisionNo}</span>
            </div>
            <div className="px-2 py-1 flex justify-between">
              <span className="font-bold">Issue No.</span>
              <span className="font-bold font-mono">{timetable.issueNo}</span>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-primary/80 font-bold bg-surface-container-low/80 text-[11px]">
                <th className="border-r-2 border-primary/80 p-2 w-24 text-left font-bold">Period</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">1</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">2</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">3</th>
                <th className="border-r border-primary/80 p-2 w-[11%]">4</th>
                <th className="border-r-2 border-primary/80 p-2 w-20 bg-surface-container-high/60 text-[10px] uppercase font-extrabold">
                  01:00 TO 01:30
                </th>
                <th className="border-r border-primary/70 p-2 w-[11%]">5</th>
                <th className="border-r border-primary/70 p-2 w-[11%]">6</th>
                <th className="p-2 w-[11%]">7</th>
              </tr>
              <tr className="border-b-2 border-primary/80 font-bold bg-surface-lowest text-[10px]">
                <th className="border-r-2 border-primary/80 p-1.5 text-left italic">Day / Time</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">9:00 - 10:00</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">10:00 - 11:00</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">11:00 - 12:00</th>
                <th className="border-r border-primary/80 p-1.5 font-mono">12:00 - 1:00</th>
                <th className="border-r-2 border-primary/80 p-1.5 bg-surface-container-high/60 text-[9px] text-text-stone uppercase">
                  RECESS
                </th>
                <th className="border-r border-primary/70 p-1.5 font-mono">1:30 - 2:20</th>
                <th className="border-r border-primary/70 p-1.5 font-mono">2:20 - 3:10</th>
                <th className="p-1.5 font-mono">3:10 - 4:00</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-primary/80 font-medium">
              {/* Monday */}
              <tr>
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left bg-surface-container-low/40">Monday</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Monday.p1?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Monday.p2?.title}</td>
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Monday.lab1)}
                </td>
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30"></td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Monday.p5?.title}</td>
                <td colSpan={2} className="p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Monday.lab2)}
                </td>
              </tr>

              {/* Tuesday */}
              <tr>
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left bg-surface-container-low/40">Tuesday</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Tuesday.p1?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Tuesday.p2?.title}</td>
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Tuesday.lab1)}
                </td>
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30"></td>
                <td colSpan={2} className="border-r border-primary/70 p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Tuesday.lab2)}
                </td>
                <td className="p-2 font-bold">{timetable.days.Tuesday.p7?.title}</td>
              </tr>

              {/* Wednesday */}
              <tr>
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left bg-surface-container-low/40">Wednesday</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Wednesday.p1?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Wednesday.p2?.title}</td>
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Wednesday.lab1)}
                </td>
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30"></td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Wednesday.p5?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Wednesday.p6?.title}</td>
                <td className="p-2 font-extrabold text-text-stone">{timetable.days.Wednesday.p7?.title}</td>
              </tr>

              {/* Thursday */}
              <tr>
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left bg-surface-container-low/40">Thursday</td>
                <td colSpan={2} className="border-r-2 border-primary/80 p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Thursday.lab1)}
                </td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Thursday.p3?.title}</td>
                <td className="border-r-2 border-primary/80 p-2 font-bold">{timetable.days.Thursday.p4?.title}</td>
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30"></td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Thursday.p5?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Thursday.p6?.title}</td>
                <td className="p-2 font-extrabold text-text-stone">{timetable.days.Thursday.p7?.title}</td>
              </tr>

              {/* Friday */}
              <tr>
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left bg-surface-container-low/40">Friday</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Friday.p1?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Friday.p2?.title}</td>
                <td className="border-r border-primary/70 p-2 font-bold">{timetable.days.Friday.p3?.title}</td>
                <td className="border-r-2 border-primary/80 p-2 font-bold">{timetable.days.Friday.p4?.title}</td>
                <td className="border-r-2 border-primary/80 bg-surface-container-high/30"></td>
                <td colSpan={2} className="border-r border-primary/70 p-1 bg-surface-container-low/20">
                  {renderFacultyLabBlock(timetable.days.Friday.lab2)}
                </td>
                <td className="p-2 font-bold">{timetable.days.Friday.p7?.title}</td>
              </tr>

              {/* Saturday */}
              <tr className="bg-surface-container-low/10">
                <td className="border-r-2 border-primary/80 p-2 font-bold text-left text-text-stone">Saturday</td>
                <td colSpan={8} className="p-2 text-center text-text-muted italic text-[11px]">
                  {timetable.days.Saturday.text}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty and Course Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-bright border border-border-default rounded p-4 shadow-xs">
          <h4 className="font-bold text-sm text-primary mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-base">badge</span>
            Department Faculty Code Directory
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {timetable.facultyDirectory.map((f) => (
              <div key={f.code} className="p-2 bg-surface-container-low border border-border-default rounded">
                <span className="font-mono font-bold text-secondary">{f.code}</span>: {f.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-bright border border-border-default rounded p-4 shadow-xs">
          <h4 className="font-bold text-sm text-primary mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-base">menu_book</span>
            Curriculum Courses & Nomenclature
          </h4>
          <div className="space-y-1.5 text-xs">
            {timetable.subjectDirectory.map((s) => (
              <div key={s.code} className="flex items-center justify-between py-1 border-b border-border-default last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary bg-surface-container px-1.5 py-0.5 rounded text-[10px]">
                    {s.code}
                  </span>
                  <span className="text-primary font-medium">{s.name}</span>
                </div>
                <span className="text-[10px] text-text-stone">{s.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderFacultyLabBlock(labBlock) {
  if (!labBlock || !labBlock.batches) return <span>-</span>;
  return (
    <div className="space-y-0.5 text-left text-[10px] py-1">
      {Object.entries(labBlock.batches).map(([secKey, b]) => (
        <div key={secKey} className="px-1 py-0.5 rounded hover:bg-surface-container-high/60 flex items-center justify-between">
          <span className="truncate">{b.text}</span>
          <span className="font-mono text-[9px] text-text-stone ml-1 shrink-0">{secKey}</span>
        </div>
      ))}
    </div>
  );
}
