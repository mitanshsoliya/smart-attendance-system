import React from "react";
import { formatShortDate } from "../../utils/formatters";

export function StudentAttendanceTab({ attendanceRecords, onScanQR }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Attendance History & Logs</h1>
          <p className="text-sm text-text-stone mt-1">Verified check-in records across all enrolled subjects.</p>
        </div>
        <button
          onClick={onScanQR}
          className="px-5 py-2.5 bg-secondary text-on-secondary font-label-md text-xs font-semibold rounded hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          <span>Mark Attendance</span>
        </button>
      </div>

      {attendanceRecords.length === 0 ? (
        <div className="p-8 bg-surface-bright border border-border-default text-center text-text-stone rounded">
          No attendance records registered. Scan active classroom QR codes to build your attendance log!
        </div>
      ) : (
        <div className="bg-surface-bright border border-border-default rounded overflow-x-auto shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-border-default font-bold text-xs uppercase text-text-stone">
                <th className="p-3.5">Subject Code</th>
                <th className="p-3.5">Subject Name</th>
                <th className="p-3.5">Lecture Date</th>
                <th className="p-3.5">Timings</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {attendanceRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-surface-container-low">
                  <td className="p-3.5 font-mono font-bold text-secondary">{rec.subject_code || "CS501"}</td>
                  <td className="p-3.5 font-semibold text-primary">{rec.subject_name || "Database Systems"}</td>
                  <td className="p-3.5 font-mono text-xs">{formatShortDate(rec.lecture_date)}</td>
                  <td className="p-3.5 font-mono text-xs">{rec.start_time} - {rec.end_time}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-1 text-xs font-bold bg-success/20 text-success rounded uppercase">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
