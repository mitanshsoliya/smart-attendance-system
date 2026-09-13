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
}) {
  const isExpired = remaining <= 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-border-default pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Live Attendance Sessions & QR Code Broadcast</h1>
          <p className="text-sm text-text-stone mt-1">Generate dynamic time-limited QR codes for live classroom attendance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            onClick={() => onGenerateQR(selectedLectureId)}
            className="px-4 py-2.5 bg-secondary text-on-secondary rounded text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            <span>Start Attendance</span>
          </button>
        </div>
      </div>

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
                  onClick={() => onGenerateQR(selectedLectureId)}
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
                onClick={() => onGenerateQR(selectedLectureId)}
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
          Select a lecture from the dropdown above and click &quot;Generate QR&quot; to begin attendance collection.
        </div>
      )}
    </div>
  );
}
