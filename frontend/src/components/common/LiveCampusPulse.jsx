import React from "react";

export function LiveCampusPulse({ statusText = "Live Academic Session Active", activeCount = 4 }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FBF9F5] border border-[#D8D2C4] shadow-2xs text-xs font-medium">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6B34] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E6B34]"></span>
      </span>
      <span className="font-serif text-[#12181F] font-bold">{statusText}</span>
      <span className="text-[#8B98A5]">•</span>
      <span className="font-mono text-[11px] text-[#9E3D24] font-bold uppercase">{activeCount} Sessions Live</span>
    </div>
  );
}
