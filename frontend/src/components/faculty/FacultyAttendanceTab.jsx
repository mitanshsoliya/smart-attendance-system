import React from "react";

export function FacultyAttendanceTab({
  lectures,
  selectedLectureId,
  setSelectedLectureId,
  qr,
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
}) {
  const isExpired = remaining <= 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Action Bar */}
      <div className="border-b border-border-default pb-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">
            Live Attendance Sessions & Geo-Fenced QR
          </h1>
          <p className="text-sm text-text-stone mt-1">
            Generate dynamic QR codes with GPS Geo-Fencing to prevent proxy attendance from outside the classroom.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Lecture Selector */}
          <select
            value={selectedLectureId}
            onChange={(e) => {
              setSelectedLectureId(e.target.value);
            }}
            className="p-2.5 bg-white border border-border-default rounded text-sm text-primary font-medium focus:outline-none focus:border-secondary"
          >
            {lectures.map((l) => (
              <option key={l.id} value={l.id}>
                {l.subject_code} - {l.subject_name} ({l.lecture_date})
              </option>
            ))}
          </select>

          {/* Geo-Fence Radius Selector (Optional: 0, 50, 100) */}
          <select
            value={selectedRadius}
            onChange={(e) => setSelectedRadius && setSelectedRadius(Number(e.target.value))}
            className="p-2.5 bg-white border border-border-default rounded text-sm text-secondary font-bold focus:outline-none focus:border-secondary"
            title="Classroom Geo-Fence Perimeter"
          >
            <option value={0}>🌐 Without Geo-Fence (Open Attendance)</option>
            <option value={50}>📍 50m Classroom Radius (Near This Device)</option>
            <option value={100}>📍 100m Classroom Radius (Near This Device)</option>
          </select>

          {/* Start Attendance Button */}
          <button
            onClick={() => onGenerateQR(selectedLectureId, selectedRadius)}
            className="px-4 py-2.5 bg-secondary text-on-secondary rounded text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            <span>Start Attendance</span>
          </button>
        </div>
      </div>

      {/* QR Code Session Card */}
      {qr ? (
        <div className="bg-surface-bright border border-border-default rounded p-6 shadow-xs flex flex-col items-center text-center space-y-4 max-w-xl mx-auto">
          {isExpired ? (
            <div className="w-full py-2 px-3 bg-[#BA1A1A]/10 border border-[#BA1A1A] rounded text-[#BA1A1A] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>QR Session Expired / Terminated</span>
            </div>
          ) : (
            <div className="w-full py-2 px-3 bg-[#2E6B34]/10 border border-[#2E6B34] rounded text-[#2E6B34] text-xs font-mono font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2E6B34] animate-pulse"></span>
                <span>Active Broadcast Token (Live)</span>
              </div>
              {qr.lecture && (
                <span className="text-[11px] font-sans font-semibold text-primary lowercase first-letter:uppercase">
                  Lecture: {qr.lecture.subject_code} - {qr.lecture.subject_name}
                </span>
              )}
            </div>
          )}

          {/* Geo-Fence Security Badge */}
          {qr.geo_fence?.enabled && qr.geo_fence?.radius_meters > 0 ? (
            <div className="w-full py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">pin_drop</span>
                <span>
                  Geo-Fence Active: <strong>{qr.geo_fence.radius_meters}m</strong> from This Device
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase">
                Device Anchor Locked
              </span>
            </div>
          ) : (
            <div className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-base">public</span>
                <span>
                  Open Attendance: <strong>Geo-Fencing Disabled</strong> (Students can scan anywhere)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono font-bold uppercase">
                No Radius Limit
              </span>
            </div>
          )}

          <div className="relative">
            <img
              src={qr.qr_code}
              alt="QR Code"
              className={`w-64 h-64 border-4 rounded p-2 transition-all ${
                isExpired
                  ? "border-[#BA1A1A] opacity-25 grayscale filter blur-[1px]"
                  : "border-secondary"
              }`}
            />
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 rounded p-4">
                <span className="material-symbols-outlined text-4xl text-[#BA1A1A] mb-1">timer_off</span>
                <span className="font-bold text-base text-[#BA1A1A]">QR Code is Expired</span>
                <p className="text-[11px] text-text-stone mt-1 max-w-[200px]">
                  Attendance cannot be marked with this code anymore.
                </p>
                <button
                  onClick={() => onGenerateQR(selectedLectureId, selectedRadius)}
                  className="mt-3 px-3 py-1.5 bg-secondary text-on-secondary rounded text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Generate New QR</span>
                </button>
              </div>
            )}
          </div>

          <div className="font-mono text-sm md:text-base font-bold text-primary break-all bg-[#FBF9F5] px-3 py-1.5 border border-border-default rounded">
            {qr.session_token}
          </div>

          {!isExpired ? (
            <p className="text-xs text-text-stone">
              Session expires in:{" "}
              <strong className="text-secondary font-mono text-base font-bold">
                {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")}
              </strong>{" "}
              ({remaining}s remaining)
            </p>
          ) : (
            <p className="text-xs font-semibold text-[#BA1A1A]">
              Expired • Attendance marks for this token will be rejected by the server.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isExpired && (
              <>
                <button
                  onClick={copyToken}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{copied ? "Copied Code!" : "Copy Code"}</span>
                </button>

                <button
                  onClick={onStopQR}
                  disabled={stoppingQr}
                  className="px-4 py-2 bg-[#BA1A1A] text-white rounded text-xs font-bold hover:bg-[#921414] transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                  <span>{stoppingQr ? "Stopping Session..." : "Stop QR Session"}</span>
                </button>
              </>
            )}

            {isExpired && (
              <button
                onClick={() => onGenerateQR(selectedLectureId, selectedRadius)}
                className="px-4 py-2 bg-secondary text-on-secondary rounded text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">autorenew</span>
                <span>Generate New Session</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-text-stone bg-surface-bright border border-border-default rounded max-w-xl mx-auto">
          Select a lecture and radius from the options above, then click &quot;Start Attendance&quot; to begin.
        </div>
      )}

      {/* Live Classroom Attendance Roster & Distance Verification Section */}
      <div className="bg-surface border border-border-default rounded p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
              Classroom Attendance Log & Verified GPS Radius
            </h3>
            <p className="text-xs text-text-stone mt-0.5">
              Live roster showing students confirmed inside the classroom geo-fence radius.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 rounded text-xs font-bold font-mono">
              {attendanceRoster.length} Checked In
            </span>
            {onRefreshAttendance && (
              <button
                onClick={onRefreshAttendance}
                disabled={loadingAttendance}
                className="p-1.5 border border-border-default rounded hover:bg-surface-container text-text-stone text-xs flex items-center gap-1 cursor-pointer"
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

        {attendanceRoster.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-stone bg-surface-bright border border-dashed border-border-default rounded">
            <span className="material-symbols-outlined text-3xl opacity-40 mb-1 block">pin_drop</span>
            No student attendance recorded for this lecture yet.
            <p className="mt-1 text-[11px] opacity-75">
              As students scan the QR code within the 50–100m classroom perimeter, their name and verified distance will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-text-stone uppercase text-[10px] tracking-wider border-b border-border-default">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Roll No. / Section</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Verified Classroom Radius / Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {attendanceRoster.map((att) => (
                  <tr key={att.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-primary">
                      {att.full_name || "Enrolled Student"}
                      <div className="text-[10px] text-text-stone font-normal font-mono">{att.email}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-text-stone">
                      {att.roll_number || "—"} {att.section ? `(${att.section})` : ""}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-text-stone whitespace-nowrap">
                      {att.attendance_time ? new Date(att.attendance_time).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>{att.status || "PRESENT"}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {att.distance_meters !== null && att.distance_meters !== undefined ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-400 font-mono shadow-2xs">
                          <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">
                            location_on
                          </span>
                          <span>
                            📍 <strong>{att.distance_meters}m</strong> from Classroom (Verified Inside Geo-Fence)
                          </span>
                        </span>
                      ) : att.location_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          <span className="material-symbols-outlined text-sm">check</span>
                          <span>Verified Classroom Location</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-stone bg-surface-container font-mono">
                          <span>Standard Check-in</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
