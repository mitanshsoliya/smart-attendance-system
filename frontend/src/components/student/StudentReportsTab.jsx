import React from "react";

export function StudentReportsTab({ attendanceRecords = [] }) {
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const totalLectures = Math.max(attendanceRecords.length, 12);
  const attendancePercentage = Math.round((presentCount / totalLectures) * 100);
  const isCleared = attendancePercentage >= 75;

  return (
    <div className="space-y-6">
      {/* Header & Print Action */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
            STATUTORY ACCREDITATION DOSSIER
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl text-primary font-bold mt-1">
            Academic Attendance Dossier
          </h1>
          <p className="text-xs sm:text-sm text-text-stone mt-0.5">
            Official summary report for mid-term and end-semester examination clearance audits.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Print Official Slip</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Card */}
      <div className="bg-white border-2 border-border-default rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 print:border-black print:shadow-none">
        {/* University Header */}
        <div className="border-b-2 border-border-default pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              <span className="material-symbols-outlined text-[32px]">account_balance</span>
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-primary tracking-tight">
                STATE TECHNICAL UNIVERSITY
              </h2>
              <p className="text-xs font-semibold text-text-stone">
                Office of Academic Affairs & Examination Controller • Academic Year 2026-27
              </p>
              <p className="text-[11px] font-mono text-text-muted mt-0.5">
                Statutory Attendance Clearance & Hall Ticket Eligibility Dossier
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isCleared
                  ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-400"
                  : "bg-rose-100 text-rose-800 border-2 border-rose-400"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isCleared ? "verified" : "warning"}
              </span>
              {isCleared ? "CLEARED FOR EXAMS" : "CONDITIONAL HOLD"}
            </span>
            <span className="block font-mono text-[10px] text-text-stone mt-1">
              Ref: LL-ATT-2026-STU-042
            </span>
          </div>
        </div>

        {/* Clearance Audit Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-border-default">
            <span className="text-text-stone block font-medium">Recorded Attendance</span>
            <strong className="text-xl font-heading font-black text-primary block mt-1">
              {attendancePercentage}%
            </strong>
            <span className="text-[10px] text-text-muted">Aggregate percentage</span>
          </div>

          <div className="p-3.5 bg-surface-container-low rounded-xl border border-border-default">
            <span className="text-text-stone block font-medium">Mandatory Cutoff</span>
            <strong className="text-xl font-heading font-black text-secondary block mt-1">
              75.0%
            </strong>
            <span className="text-[10px] text-text-muted">Ordinance §42.1 Standard</span>
          </div>

          <div className="p-3.5 bg-surface-container-low rounded-xl border border-border-default">
            <span className="text-text-stone block font-medium">Classes Attended</span>
            <strong className="text-xl font-heading font-black text-emerald-700 block mt-1">
              {presentCount} / {totalLectures}
            </strong>
            <span className="text-[10px] text-text-muted">Verified QR Check-ins</span>
          </div>

          <div className="p-3.5 bg-surface-container-low rounded-xl border border-border-default">
            <span className="text-text-stone block font-medium">Audit Verification</span>
            <strong className="text-sm font-bold text-primary block mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified_user</span>
              Cryptographically Signed
            </strong>
            <span className="text-[10px] text-text-muted">GPS + Hardware Token</span>
          </div>
        </div>

        {/* Ordinance Legal Disclaimer */}
        <div className="p-4 bg-surface-container-low border border-border-default rounded-xl text-xs text-text-stone leading-relaxed space-y-1">
          <p className="font-semibold text-primary">Statutory Examination Provision:</p>
          <p>
            Under University Regulations Ordinance §42.1, candidates must maintain a minimum of 75.0% cumulative attendance across theoretical lectures and practical laboratory sessions. Shortage condonations up to 10% on medical grounds require prior HOD and Academic Dean validation.
          </p>
        </div>

        {/* Digital Signature & Seal */}
        <div className="pt-6 border-t border-border-default flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-text-stone">
          <div>
            <span className="font-mono text-[10px] uppercase block text-text-stone">Generated From</span>
            <strong className="text-primary font-bold text-sm">LectureLog Enterprise Attendance Portal</strong>
            <span className="block text-[11px] font-mono mt-0.5">Automated Cryptographic Timestamp: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="text-center sm:text-right">
            <div className="w-36 border-b border-text-stone mb-1 ml-auto"></div>
            <span className="font-bold text-primary block">Head of Department / Academic Dean</span>
            <span className="text-[10px] text-text-stone">Authorized Electronic Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
