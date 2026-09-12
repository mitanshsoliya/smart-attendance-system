import React from "react";

export function AttendanceRing({ percentage = 0, size = 120, strokeWidth = 10, label = "Attendance" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  const isCompliant = validPct >= 75;
  const strokeColor = isCompliant ? "#2E6B34" : "#9E3D24"; // Green vs Terracotta

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#D8D2C4"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
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
          <span className="font-serif-display text-2xl font-bold text-[#12181F] leading-none">
            {validPct}%
          </span>
          <span className="text-[10px] font-mono uppercase text-[#6B7280] font-semibold mt-1">
            {isCompliant ? "Cleared" : "Deficit"}
          </span>
        </div>
      </div>
      {label && <span className="text-xs font-mono font-bold text-[#6B7280] uppercase tracking-wider mt-2">{label}</span>}
    </div>
  );
}
