import React, { useState, useMemo } from "react";
import { formatShortDate, formatTimeWithAmPm } from "../../utils/formatters";

export function StudentAttendanceTab({ attendanceRecords = [], onScanQR }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const totalCount = attendanceRecords.length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const matchQuery =
        (rec.subject_code || "").toLowerCase().includes(search.toLowerCase()) ||
        (rec.subject_name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || rec.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [attendanceRecords, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Metric Summary */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                ACADEMIC LOG
              </span>
              <span className="text-xs text-text-stone">Real-Time Ledger</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-primary font-bold">
              Attendance History & Logs
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5">
              Verified classroom check-in records with cryptographic token & GPS geo-fence audit timestamps.
            </p>
          </div>

          <button
            onClick={onScanQR}
            className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Mark Attendance</span>
          </button>
        </div>

        {/* Quick Filter Pills & Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone block">
              Total Sessions
            </span>
            <div className="font-heading text-xl font-bold text-primary mt-0.5">
              {totalCount}
            </div>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
              Present Check-ins
            </span>
            <div className="font-heading text-xl font-bold text-emerald-600 mt-0.5">
              {presentCount}
            </div>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
              Missed / Absent
            </span>
            <div className="font-heading text-xl font-bold text-rose-600 mt-0.5">
              {absentCount}
            </div>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone block">
              Compliance Ratio
            </span>
            <div className="font-heading text-xl font-bold text-primary mt-0.5">
              {attendancePercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-border-default p-4 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-stone text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject code (CS501) or course title..."
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-border-default rounded-lg text-xs sm:text-sm text-primary placeholder:text-text-stone/70 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-stone shrink-0">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low border border-border-default rounded-lg text-xs font-semibold text-primary focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses ({totalCount})</option>
            <option value="PRESENT">Present Only ({presentCount})</option>
            <option value="ABSENT">Absent Only ({absentCount})</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-border-default rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-surface-container text-text-stone flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">event_busy</span>
          </div>
          <h3 className="font-heading font-bold text-base text-primary">No Attendance Records Found</h3>
          <p className="text-xs text-text-stone max-w-sm mx-auto">
            {search || statusFilter !== "ALL"
              ? "No sessions match your search criteria. Try clearing filters or search keyword."
              : "No check-ins logged yet. Attend active classroom sessions and scan the instructor's QR code!"}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border-default rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-default font-bold text-[11px] uppercase tracking-wider text-text-stone whitespace-nowrap">
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Lecture Date</th>
                  <th className="py-3.5 px-4">Timings</th>
                  <th className="py-3.5 px-4">Check-in Timestamp</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {rec.subject_code || "CS501"}
                        </span>
                        <span className="font-semibold text-primary">
                          {rec.subject_name || "Course Session"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-medium">
                      {formatShortDate(rec.lecture_date) || "-"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-text-stone">
                      {rec.start_time && rec.end_time ? `${rec.start_time} - ${rec.end_time}` : "-"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="text-primary font-semibold">
                        {formatTimeWithAmPm(rec.attendance_time)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full uppercase ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {rec.status === "PRESENT" ? "check" : "close"}
                        </span>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
