import React from "react";

export function FacultyAttendanceTab({ lectures, selectedLectureId, setSelectedLectureId, qr, onGenerateQR, remaining, copyToken, copied }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border-default pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Live Attendance Sessions & QR Code Broadcast</h1>
          <p className="text-sm text-text-stone mt-1">Generate dynamic time-limited QR codes for live classroom attendance.</p>
        </div>
        <select
          value={selectedLectureId}
          onChange={(e) => {
            setSelectedLectureId(e.target.value);
            onGenerateQR(e.target.value);
          }}
          className="p-2.5 bg-white border border-border-default rounded text-sm text-primary font-medium"
        >
          {lectures.map((l) => (
            <option key={l.id} value={l.id}>
              {l.subject_code} - {l.subject_name} ({l.lecture_date})
            </option>
          ))}
        </select>
      </div>

      {qr ? (
        <div className="bg-surface-bright border border-border-default rounded p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <span className="text-xs uppercase font-bold text-success font-mono">Active Broadcast Token</span>
          <img src={qr.qr_code} alt="QR Code" className="w-64 h-64 border-4 border-secondary rounded p-2" />
          <div className="font-mono text-xl font-bold text-primary">{qr.session_token}</div>
          <p className="text-xs text-text-stone">Session expires in: <strong className="text-secondary">{remaining}s</strong></p>
          <button onClick={copyToken} className="px-4 py-2 bg-secondary text-on-secondary rounded text-xs font-bold">
            {copied ? "Copied Code!" : "Copy Code"}
          </button>
        </div>
      ) : (
        <div className="p-8 text-center text-text-stone bg-surface-bright border border-border-default rounded">
          Select a lecture from the dropdown above and click "Generate QR" to begin attendance collection.
        </div>
      )}
    </div>
  );
}
