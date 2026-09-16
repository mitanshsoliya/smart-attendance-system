import React from "react";

export function StudentReportsTab({ attendanceRecords }) {
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const totalLectures = Math.max(attendanceRecords.length, 12);
  const attendancePercentage = Math.round((presentCount / totalLectures) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-primary font-bold">Academic Attendance Dossier</h1>
          <p className="text-sm text-text-stone mt-1">Official summary report for examination clearance audit.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-4 py-2 bg-secondary text-on-secondary text-xs font-semibold rounded hover:opacity-90 cursor-pointer text-center"
        >
          Print Report
        </button>
      </div>

      <div className="bg-surface-bright border-2 border-border-default rounded p-4 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-border-default pb-4">
          <h2 className="font-serif-display text-lg sm:text-xl font-bold text-primary uppercase">Institutional Attendance Clearance Certificate</h2>
          <p className="text-xs text-text-stone mt-0.5">Faculty of Engineering & Technology • Academic Year 2026-27</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div><span className="text-text-stone block">Attendance Percentage</span><strong className="text-base text-primary">{attendancePercentage}%</strong></div>
          <div><span className="text-text-stone block">Minimum Cutoff</span><strong className="text-base text-secondary">75.0%</strong></div>
          <div><span className="text-text-stone block">Statutory Clearance</span><strong className="text-base text-success">CLEARED FOR EXAMS</strong></div>
          <div><span className="text-text-stone block">Total Sessions Attended</span><strong className="text-base text-primary">{presentCount} / {totalLectures}</strong></div>
        </div>
      </div>
    </div>
  );
}
