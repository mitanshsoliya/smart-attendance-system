import React, { useState, useMemo } from "react";

export function FacultyAttendanceTab({
  lectures = [],
  selectedLectureId,
  setSelectedLectureId,
  qr,
  setQr,
  onGenerateQR,
  onStopQR,
  stoppingQr,
  remaining,
  copyToken,
  copied,
  selectedRadius = 100,
  setSelectedRadius,
  attendanceRoster = [],
  loadingAttendance = false,
  onRefreshAttendance,
  isSessionActive,
  isSessionExpired,
  onUpdateStatus,
}) {
  const [rosterSearch, setRosterSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const isExpired = remaining <= 0;
  const isQrForSelectedLecture = Boolean(qr && String(qr.lecture_id) === String(selectedLectureId));
  const activeSession = isSessionActive ?? (!isExpired && isQrForSelectedLecture);

  const selectedLecture =
    lectures.find((l) => String(l.id) === String(selectedLectureId)) || lectures[0] || null;

  const presentStudents = attendanceRoster.filter((a) => a.status === "PRESENT");
  const absentStudents = attendanceRoster.filter((a) => a.status === "ABSENT");

  const filteredRoster = useMemo(() => {
    return attendanceRoster.filter((att) => {
      const matchSearch =
        (att.full_name || "").toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (att.roll_number || "").toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (att.email || "").toLowerCase().includes(rosterSearch.toLowerCase());
      const matchStatus = statusFilter === "ALL" || att.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [attendanceRoster, rosterSearch, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header & Session Controller */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-border-default pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                DYNAMIC BROADCAST TERMINAL
              </span>
              <span className="text-xs text-text-stone">Session Engine</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-primary font-bold">
              Live Attendance & Geo-Fenced QR
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5">
              Broadcast cryptographically rotating QR codes with GPS Geo-Fencing to eliminate proxy attendance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Lecture Selector */}
            <select
              value={selectedLectureId}
              onChange={(e) => {
                const newLecId = e.target.value;
                setSelectedLectureId(newLecId);
                if (setQr && qr && String(qr.lecture_id) !== String(newLecId)) {
                  setQr(null);
                }
              }}
              className="p-2.5 bg-surface-container-low border border-border-default rounded-xl text-xs sm:text-sm text-primary font-semibold focus:outline-none focus:border-primary"
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.subject_code} - {l.subject_name} ({l.lecture_date})
                </option>
              ))}
            </select>

            {/* Geo-Fence Radius Selector */}
            <select
              value={selectedRadius}
              onChange={(e) => setSelectedRadius && setSelectedRadius(Number(e.target.value))}
              className="p-2.5 bg-surface-container-low border border-border-default rounded-xl text-xs sm:text-sm text-primary font-bold focus:outline-none focus:border-primary"
              title="Classroom Geo-Fence Perimeter"
            >
              <option value={0}>🌐 Open (No Radius Limit)</option>
              <option value={50}>📍 50m Strict Classroom Radius</option>
              <option value={100}>📍 100m Campus Hall Radius</option>
            </select>

            {/* Start Attendance Button */}
            <button
              onClick={() => onGenerateQR(selectedLectureId, selectedRadius)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-xs font-bold hover:shadow-md hover:brightness-110 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
              <span>Start Attendance</span>
            </button>
          </div>
        </div>

        {/* Selected Lecture Details Banner */}
        {selectedLecture && (
          <div className="mt-4 p-3.5 bg-surface-container-low rounded-xl border border-border-default/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">co_present</span>
              </span>
              <div>
                <div className="font-bold text-sm text-primary flex items-center gap-2">
                  <span>{selectedLecture.subject_code} - {selectedLecture.subject_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-text-stone font-semibold">
                    Session #{selectedLecture.id}
                  </span>
                </div>
                <p className="text-text-stone font-mono text-[11px] mt-0.5">
                  📅 {selectedLecture.lecture_date} • ⏰ {selectedLecture.start_time} - {selectedLecture.end_time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {presentStudents.length} Present
              </span>
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-surface-container text-text-stone">
                {attendanceRoster.length} Total
              </span>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Session Card */}
      {isQrForSelectedLecture ? (
        <div className="bg-white border border-border-default rounded-2xl p-6 shadow-xs flex flex-col items-center text-center space-y-4 max-w-lg mx-auto">
          {isExpired ? (
            <div className="w-full py-2 px-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>QR Session Expired / Terminated</span>
            </div>
          ) : (
            <div className="w-full py-2.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Broadcast Token (Live)</span>
              </div>
              {qr.lecture && (
                <span className="text-[11px] font-sans font-medium text-text-stone lowercase first-letter:uppercase">
                  Lecture: {qr.lecture.subject_code} - {qr.lecture.subject_name}
                </span>
              )}
            </div>
          )}

          {/* Geo-Fence Security Badge */}
          {qr.geo_fence?.enabled && qr.geo_fence?.radius_meters > 0 ? (
            <div className="w-full py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-emerald-600 text-base">pin_drop</span>
                <span>Geo-Fence Active: {qr.geo_fence.radius_meters}m from Faculty Device</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase">
                Device Anchor Locked
              </span>
            </div>
          ) : (
            <div className="w-full py-2 px-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-blue-600 text-base">public</span>
                <span>Open Attendance (No Radius Limit)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono font-bold uppercase">
                Open Access
              </span>
            </div>
          )}

          {/* QR Image Frame */}
          <div className="relative">
            <img
              src={qr.qr_code}
              alt="Classroom Attendance QR Code"
              className={`w-56 h-56 sm:w-64 sm:h-64 max-w-full aspect-square border-4 rounded-2xl p-2 transition-all mx-auto ${
                isExpired
                  ? "border-rose-300 opacity-25 grayscale filter blur-[1px]"
                  : "border-primary shadow-md"
              }`}
            />
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-2xl p-4">
                <span className="material-symbols-outlined text-4xl text-rose-600 mb-1">timer_off</span>
                <span className="font-bold text-sm text-rose-700">QR Code is Expired</span>
                <p className="text-[11px] text-text-stone mt-1 max-w-[200px]">
                  Attendance session closed. Students who did not scan are marked as Absent below.
                </p>
                <button
                  onClick={() => onGenerateQR(selectedLectureId, selectedRadius)}
                  className="mt-3 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Generate New QR</span>
                </button>
              </div>
            )}
          </div>

          <div className="font-mono text-xs sm:text-sm font-bold text-primary break-all bg-surface-container-low px-3 py-1.5 border border-border-default rounded-xl">
            {qr.session_token}
          </div>

          {!isExpired ? (
            <p className="text-xs text-text-stone font-medium">
              Session expires in:{" "}
              <strong className="text-primary font-mono text-base font-bold">
                {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")}
              </strong>{" "}
              ({remaining}s remaining)
            </p>
          ) : (
            <p className="text-xs font-semibold text-rose-600">
              Expired • Attendance marks for this token will be rejected by the server.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {!isExpired && (
              <>
                <button
                  onClick={copyToken}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{copied ? "Copied Token!" : "Copy Token"}</span>
                </button>

                <button
                  onClick={onStopQR}
                  disabled={stoppingQr}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                  <span>{stoppingQr ? "Stopping..." : "Stop QR Session"}</span>
                </button>
              </>
            )}

            {isExpired && (
              <button
                onClick={() => onGenerateQR(selectedLectureId, selectedRadius)}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">autorenew</span>
                <span>Generate New Session</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-text-stone bg-white border border-border-default rounded-2xl max-w-lg mx-auto shadow-xs space-y-2">
          <span className="material-symbols-outlined text-3xl text-text-stone/60">sensors</span>
          <p className="font-semibold text-primary">No Active QR Session for This Lecture</p>
          <p>Select a lecture and radius from the bar above, then click &quot;Start Attendance&quot; to begin.</p>
        </div>
      )}

      {/* Classroom Attendance Roster & Manual Status Toggle */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                Classroom Attendance Log & Verified GPS Radius
              </h3>
              {activeSession && (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Live Active</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                <span>Socket.io Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-text-stone mt-0.5">
              Live roster showing students verified inside classroom radius. Use one-click actions to toggle Present / Absent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-mono">
              {presentStudents.length} Present
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold font-mono">
              {absentStudents.length} Absent
            </span>
            <span className="px-2.5 py-1 bg-surface-container text-text-stone border border-border-default rounded-lg text-xs font-bold font-mono">
              Total: {attendanceRoster.length}
            </span>

            {onRefreshAttendance && (
              <button
                onClick={onRefreshAttendance}
                disabled={loadingAttendance}
                className="p-1.5 border border-border-default rounded-lg hover:bg-surface-container text-text-stone text-xs flex items-center gap-1 cursor-pointer"
                title="Refresh Attendance Log"
              >
                <span className={`material-symbols-outlined text-[16px] ${loadingAttendance ? "animate-spin" : ""}`}>
                  sync
                </span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-stone text-[18px]">
              search
            </span>
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Search student roster by name, roll number, or email..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-border-default rounded-xl text-xs sm:text-sm text-primary placeholder:text-text-stone/70 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-stone shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container-low border border-border-default rounded-xl text-xs font-semibold text-primary focus:outline-none focus:border-primary"
            >
              <option value="ALL">All ({attendanceRoster.length})</option>
              <option value="PRESENT">Present ({presentStudents.length})</option>
              <option value="ABSENT">Absent ({absentStudents.length})</option>
            </select>
          </div>
        </div>

        {filteredRoster.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-stone bg-surface-container-low border border-dashed border-border-default rounded-xl space-y-1">
            <span className="material-symbols-outlined text-3xl opacity-40 block">pin_drop</span>
            <p className="font-semibold">No attendance records found</p>
            <p className="text-[11px] text-text-muted">
              {activeSession
                ? "Waiting for student scans... Scanned students will appear here automatically."
                : "No student check-ins recorded for this lecture yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-surface-container-low text-text-stone uppercase text-[10px] tracking-wider border-b border-border-default">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll No. / Section</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verified GPS Distance</th>
                  <th className="py-3 px-4 text-right">Manual Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {filteredRoster.map((att, idx) => {
                  const isPresent = att.status === "PRESENT";
                  return (
                    <tr
                      key={att.id || `att-${att.student_id || idx}`}
                      className={`transition-all duration-500 ${
                        att.justMarked
                          ? "bg-emerald-500/10 border-l-4 border-l-emerald-500 font-medium"
                          : isPresent
                          ? "hover:bg-emerald-50/30"
                          : "hover:bg-rose-50/30 bg-rose-500/[0.02]"
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-primary">
                        <div className="flex items-center gap-2">
                          <span>{att.full_name || "Enrolled Student"}</span>
                          {att.justMarked && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse inline-flex items-center gap-0.5">
                              ⚡ Just Checked In
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-stone font-normal font-mono">{att.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-text-stone">
                        {att.roll_number || "—"} {att.section ? `(${att.section})` : ""}
                      </td>
                      <td className="py-3 px-4 font-mono text-text-stone whitespace-nowrap">
                        {isPresent ? (
                          att.attendance_time ? (
                            new Date(att.attendance_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          ) : (
                            "—"
                          )
                        ) : (
                          <span className="italic text-[11px] text-rose-600">Did Not Check In</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPresent ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${att.justMarked ? "ring-2 ring-emerald-400" : ""}`}>
                            <span className="material-symbols-outlined text-[15px] text-emerald-600 font-bold">check_circle</span>
                            <span>PRESENT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="material-symbols-outlined text-[13px]">cancel</span>
                            <span>ABSENT</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPresent ? (
                          att.distance_meters !== null && att.distance_meters !== undefined && att.student_latitude ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
                              <span className="material-symbols-outlined text-sm text-emerald-600">
                                location_on
                              </span>
                              <span>📍 {att.distance_meters}m from Classroom</span>
                            </span>
                          ) : att.location_verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              <span>Manual Override</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-stone font-mono">Standard Check-in</span>
                          )
                        ) : (
                          <span className="text-[11px] text-rose-600 font-mono">❌ Did Not Scan QR</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {isPresent ? (
                          <button
                            onClick={() => onUpdateStatus && onUpdateStatus(att.student_id, "ABSENT", att.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                            title="Change status to Absent"
                          >
                            <span className="material-symbols-outlined text-[13px]">person_off</span>
                            <span>Mark Absent</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus && onUpdateStatus(att.student_id, "PRESENT", att.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                            title="Change status to Present"
                          >
                            <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                            <span>Mark Present</span>
                          </button>
                        )}
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
