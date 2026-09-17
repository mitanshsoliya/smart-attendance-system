import React from "react";
import { formatDateDisplay } from "../../utils/formatters";

export function HodReportsTab({ students = [], onExportLedger, department }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              ACADEMIC DOSSIER
            </span>
            <span className="text-xs text-text-stone">Official Hall Ticket Clearance</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Dean of Academic Affairs Statutory Ledger
          </h1>
          <p className="text-xs sm:text-sm text-text-stone mt-0.5">
            Certified report forwarded to the Dean’s Office for semester hall-ticket issuance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Ledger</span>
          </button>
          <button
            onClick={onExportLedger}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Official Ledger Document */}
      <div className="bg-white border-2 border-border-default rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 print:border-black print:shadow-none">
        <div className="text-center pb-6 border-b-2 border-primary">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-2 font-bold text-xl shadow-sm">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-black text-primary uppercase tracking-tight">
            STATE TECHNICAL UNIVERSITY • FACULTY OF ENGINEERING
          </h2>
          <h3 className="text-sm sm:text-base font-bold text-primary mt-0.5">
            {department || "Department of Computer Science & Engineering"}
          </h3>
          <p className="text-xs text-text-stone mt-1 font-mono">
            Semester V Statutory Attendance Ledger • {formatDateDisplay()}
          </p>
        </div>

        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[550px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-default font-bold uppercase text-[11px] text-text-stone">
                <th className="py-2.5 px-3">Roll Number</th>
                <th className="py-2.5 px-3">Candidate Name</th>
                <th className="py-2.5 px-3 text-right">Attendance %</th>
                <th className="py-2.5 px-3 text-center">Clearance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/60">
              {students.map((s, idx) => {
                const pct = s.attendancePercentage ?? s.attendance_percentage ?? 0;
                const isCleared = pct >= 75;
                return (
                  <tr key={s.id || idx} className="hover:bg-surface-container-low/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                      {s.rollNumber || s.roll_number || `2024-CSE-00${s.id || idx + 1}`}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-primary">
                      {s.fullName || s.full_name || "Student"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                      {pct}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isCleared
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {isCleared ? "check" : "close"}
                        </span>
                        {isCleared ? "CLEARED" : "DISQUALIFIED"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Digital Signature */}
        <div className="pt-6 border-t border-border-default flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-text-stone">
          <div>
            <span className="font-mono text-[10px] uppercase block text-text-stone">Cryptographic Audit</span>
            <strong className="text-primary font-bold">Verified by Department HOD Terminal</strong>
          </div>
          <div className="text-center sm:text-right">
            <div className="w-36 border-b border-text-stone mb-1 ml-auto"></div>
            <span className="font-bold text-primary block">Head of Department (HOD)</span>
            <span className="text-[10px] text-text-stone">Authorized Electronic Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
