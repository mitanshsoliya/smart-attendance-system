import React from "react";

export function LiveCampusPulse({ statusText = "Live Academic Session Active", activeCount = 4 }) {
  return (
    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
      </span>
      <span className="text-slate-800 font-semibold tracking-tight">{statusText}</span>
      <span className="text-slate-300">•</span>
      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
        {activeCount} Sessions Live
      </span>
    </div>
  );
}

