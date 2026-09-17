import React from "react";

export function HodAnalyticsTab({ students = [] }) {
  const lowAttendance = students.filter((s) => (s.attendancePercentage ?? s.attendance_percentage ?? 0) < 75);
  const clearedAttendance = students.filter((s) => (s.attendancePercentage ?? s.attendance_percentage ?? 0) >= 75);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                ACCREDITATION AUDIT
              </span>
              <span className="text-xs text-text-stone">NBA / NAAC Statutory Metrics</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              Institutional Compliance & Attendance Risk
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5 max-w-3xl">
              Cohort risk distribution, condonation audits, and examination hall ticket disqualification metrics under Ordinance §42.1.
            </p>
          </div>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-4 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone block">
              Total Audited Cohort
            </span>
            <div className="font-heading text-2xl font-bold text-primary mt-1">
              {students.length}
            </div>
            <span className="text-[11px] text-text-stone">Enrolled candidates</span>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Statutory Cleared (≥75%)
            </span>
            <div className="font-heading text-2xl font-bold text-emerald-700 mt-1">
              {clearedAttendance.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Eligible for end-sem exams</span>
          </div>

          <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
              Attendance Shortage (&lt;75%)
            </span>
            <div className="font-heading text-2xl font-bold text-rose-700 mt-1">
              {lowAttendance.length}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">Requires condonation or hold</span>
          </div>
        </div>
      </div>

      {/* Low Attendance Audit Table */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <h3 className="font-heading text-base font-bold text-rose-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-lg">warning</span>
            Candidates Under Condonation Threshold (&lt;75%)
          </h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {lowAttendance.length} Students at Risk
          </span>
        </div>

        {lowAttendance.length === 0 ? (
          <div className="py-8 text-center bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
            <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
            <p className="font-bold">100% Departmental Compliance!</p>
            <p>All enrolled students currently meet or exceed the mandatory 75% attendance threshold.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-default text-[11px] font-bold uppercase tracking-wider text-text-stone">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                  <th className="py-3 px-4 text-center">Examination Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {lowAttendance.map((s, idx) => {
                  const pct = s.attendancePercentage ?? s.attendance_percentage ?? 0;
                  return (
                    <tr key={s.id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {s.rollNumber || s.roll_number || `2024-CSE-00${s.id || idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {s.fullName || s.full_name || "Student"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-stone">{s.email}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {pct}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-full uppercase">
                          CONDITIONAL HOLD
                        </span>
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
