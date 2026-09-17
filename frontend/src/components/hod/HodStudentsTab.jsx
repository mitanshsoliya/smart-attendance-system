import React, { useState, useMemo } from "react";

export function HodStudentsTab({
  students = [],
  onOpenAddModal,
  onDeleteStudent,
  onResetDevice,
  onUnlockAttendance,
  onUpdateSection,
  onExportLedger,
}) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return (students || []).filter((s) => {
      const name = (s.fullName || s.full_name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const roll = (s.rollNumber || s.roll_number || "").toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = name.includes(q) || email.includes(q) || roll.includes(q);
      const matchesSection = sectionFilter === "ALL" || (s.section || "Sec A") === sectionFilter;
      return matchesSearch && matchesSection;
    });
  }, [students, search, sectionFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                STUDENT COHORT GOVERNANCE
              </span>
              <span className="text-xs text-text-stone">Roster & Anti-Proxy Management</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              Student Directory & Statutory Roster ({filtered.length})
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5 max-w-3xl">
              Audit student attendance percentages, assign cohort sections, reset bound hardware devices, and manage examination clearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Add Student</span>
            </button>
            <button
              type="button"
              onClick={onExportLedger}
              className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-stone text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search student by name, roll number, or institutional email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-border-default rounded-xl text-xs sm:text-sm text-primary placeholder:text-text-stone/70 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-stone shrink-0">Section:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container-low border border-border-default rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Sections</option>
              <option value="Sec A">Sec A</option>
              <option value="Sec B">Sec B</option>
              <option value="Sec C">Sec C</option>
              <option value="Sec D">Sec D</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-border-default rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-text-stone space-y-2">
            <span className="material-symbols-outlined text-3xl text-text-stone/60">group_off</span>
            <p className="font-semibold text-primary">No student records found</p>
            <p className="text-[11px] text-text-muted">
              Try adjusting your search criteria or add new students to the department roster.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[850px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-default text-[11px] font-bold uppercase tracking-wider text-text-stone">
                  <th className="py-3 px-4">Candidate Student</th>
                  <th className="py-3 px-4">Section (HOD Assignment)</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4 text-center">Attended / Total</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Security & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {filtered.map((s, idx) => {
                  const name = s.fullName || s.full_name || "Student";
                  const roll =
                    s.rollNumber || s.roll_number || `2024-CSE-${String(s.id || idx + 1).padStart(3, "0")}`;
                  const pct = s.attendancePercentage ?? s.attendance_percentage ?? 0;
                  const stdPhone = s.studentPhone || s.student_phone || "N/A";
                  const parPhone = s.parentPhone || s.parent_phone || "N/A";
                  const dept = s.department || "CSE Department";

                  return (
                    <tr key={s.id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-primary">{name}</div>
                        <div className="text-xs font-mono text-text-stone flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{roll} • {s.email}</span>
                          {s.isAttendanceLocked && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              <span className="material-symbols-outlined text-[11px]">lock</span> Locked
                            </span>
                          )}
                          {s.isDeviceBound ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <span className="material-symbols-outlined text-[11px]">smartphone</span> Bound
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-text-stone bg-surface-container px-1.5 py-0.5 rounded">
                              Unbound
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {onUpdateSection ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={s.section || "Sec A"}
                              onChange={(e) => onUpdateSection(s.id, e.target.value)}
                              className="py-1 px-2.5 bg-surface-container-low border border-border-default hover:border-primary rounded-lg text-xs font-bold text-primary cursor-pointer focus:outline-none focus:border-primary"
                              title="Assign Cohort Section (HOD Exclusive)"
                            >
                              <option value="Sec A">Sec A</option>
                              <option value="Sec B">Sec B</option>
                              <option value="Sec C">Sec C</option>
                              <option value="Sec D">Sec D</option>
                            </select>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">{s.section || "Sec A"}</span>
                        )}
                        <div className="text-[10px] text-text-stone mt-0.5">{dept}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-text-stone">
                        <div>Std: <strong className="text-primary">{stdPhone}</strong></div>
                        <div>Par: {parPhone}</div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-xs">
                        {s.attendedLectures ?? s.attended_count ?? 0} / {s.totalLectures ?? s.total_lectures ?? 14}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                        {pct}%
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                            pct >= 75
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {pct >= 75 ? "CLEARED" : "SHORTAGE"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onUnlockAttendance && s.isAttendanceLocked && (
                            <button
                              type="button"
                              onClick={() => onUnlockAttendance(s.id, name)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                              title="Unlock Attendance Access"
                            >
                              <span className="material-symbols-outlined text-[13px]">lock_open</span>
                              <span>Unlock</span>
                            </button>
                          )}
                          {onResetDevice && (
                            <button
                              type="button"
                              onClick={() => onResetDevice(s.id, name)}
                              disabled={!s.isDeviceBound}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                                s.isDeviceBound
                                  ? "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 cursor-pointer"
                                  : "bg-surface-container text-text-stone/60 border border-border-default cursor-not-allowed opacity-60"
                              }`}
                              title={s.isDeviceBound ? "Reset registered device binding" : "No device bound yet"}
                            >
                              <span className="material-symbols-outlined text-[13px]">phonelink_erase</span>
                              <span>{s.isDeviceBound ? "Reset Device" : "No Device"}</span>
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteStudent(s.id)}
                            className="text-xs text-rose-600 hover:underline cursor-pointer px-1 py-1"
                            title="Remove student from roster"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
