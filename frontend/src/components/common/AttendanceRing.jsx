import React from "react";

export function AttendanceRing({ percentage = 0, size = 120, strokeWidth = 10, label = "Attendance" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPct = Math.min(100, Math.max(0, Math.round(percentage)));
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  const isCompliant = validPct >= 75;
  const isWarning = validPct >= 65 && validPct < 75;

  const strokeColor = isCompliant ? "#16A34A" : isWarning ? "#F59E0B" : "#DC2626";
  const badgeBg = isCompliant ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isWarning ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200";
  const statusText = isCompliant ? "Cleared" : isWarning ? "Warning" : "Deficit";

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none tracking-tight">
            {validPct}%
          </span>
          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border mt-1 ${badgeBg}`}>
            {statusText}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2.5">
          {label}
        </span>
      )}
    </div>
  );
}

