import React from "react";

export function FacultyLiveToast({ alert, onDismiss, soundEnabled = true }) {
  if (!alert) return null;

  return (
    <div
      role="alert"
      className="fixed top-6 right-6 z-50 max-w-sm w-full animate-bounce-short transition-all duration-300 pointer-events-auto"
    >
      <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-400 rounded-2xl shadow-xl p-4 flex items-start gap-3.5 ring-4 ring-emerald-500/10">
        {/* Animated Green Badge */}
        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
          <span className="material-symbols-outlined text-[22px] animate-pulse">
            check_circle
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ⚡ Live Check-In
            </span>
            <span className="text-[10px] text-text-stone font-mono ml-auto flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[13px] opacity-70"
                title={soundEnabled ? "Audio chime active" : "Audio chime muted"}
              >
                {soundEnabled ? "volume_up" : "volume_off"}
              </span>
              <span>{alert.time || "Just now"}</span>
            </span>
          </div>

          <h4 className="text-sm font-bold text-primary truncate leading-tight mt-1">
            {alert.full_name || alert.name || "Student"}
          </h4>

          <div className="flex items-center gap-2 mt-1 text-xs text-text-stone">
            {alert.roll_number && (
              <span className="font-mono font-semibold bg-surface-container px-1.5 py-0.5 rounded text-[11px] text-primary">
                Roll: {alert.roll_number}
              </span>
            )}
            {alert.section && (
              <span className="text-[11px]">{alert.section}</span>
            )}
            <span className="font-semibold text-emerald-600 text-[11px] ml-auto flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">done_all</span>
              Marked Present
            </span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="text-text-stone/60 hover:text-text-stone p-1 rounded-lg hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
          title="Dismiss notification"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
export default FacultyLiveToast;
