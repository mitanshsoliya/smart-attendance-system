import React, { useEffect, useState } from "react";

/**
 * Animated floating toast banner shown to students when faculty starts an attendance QR session.
 *
 * @param {object} alert - The lecture_started event data { lecture_id, subject_name, subject_code, department, faculty_name }
 * @param {function} onScanNow - Callback when student clicks "Scan QR Now"
 * @param {function} onDismiss - Callback to dismiss the banner
 */
export function LiveAttendanceToast({ alert, onScanNow, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      // Auto dismiss after 60 seconds if not interacted with
      const timer = setTimeout(() => {
        handleClose();
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 300);
  };

  const handleScanClick = () => {
    setVisible(false);
    if (onScanNow) {
      onScanNow(alert);
    }
  };

  if (!alert) return null;

  const facultyName = alert.faculty_name || "Faculty Instructor";
  const subjectCode = alert.subject_code || "ACAD";
  const subjectName = alert.subject_name || "Course Session";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-6 scale-95 pointer-events-none"
      }`}
    >
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-2xl blur-md opacity-70 animate-pulse -z-10" />

      {/* Main Toast Card */}
      <div className="relative bg-slate-900/95 backdrop-blur-xl border border-blue-400/30 rounded-2xl shadow-2xl p-4 sm:p-5 text-white overflow-hidden">
        {/* Subtle decorative background light */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          {/* Header left: Pulsing indicator & title */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 text-amber-300">
              <span className="material-symbols-outlined text-[20px] animate-bounce">
                notifications_active
              </span>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Live Attendance Open!
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  Live Now
                </span>
              </div>
              {alert.department && (
                <p className="text-[11px] text-blue-300/80 font-medium">
                  {alert.department}
                </p>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Message body */}
        <div className="mt-3 pl-10 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <p>
            <strong className="text-white font-semibold">{facultyName}</strong> ne{" "}
            <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-xs border border-blue-400/30">
              {subjectCode}
            </span>{" "}
            ({subjectName}) ka attendance session shuru kiya hai.
          </p>
        </div>

        {/* Action Button Row */}
        <div className="mt-4 pl-10 flex items-center gap-3">
          <button
            onClick={handleScanClick}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">
              qr_code_scanner
            </span>
            <span>Scan QR Now</span>
          </button>

          <button
            onClick={handleClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveAttendanceToast;
