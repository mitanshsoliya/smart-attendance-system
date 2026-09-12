import React, { useState } from "react";

export function HodSettingsTab() {
  const [threshold, setThreshold] = useState("75.0");
  const [graceMinutes, setGraceMinutes] = useState("5");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-[#D8D2C4] pb-4">
        <h1 className="font-serif text-3xl font-bold text-[#12181F]">Department Governance & Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">Configure statutory thresholds and institutional governance parameters.</p>
      </div>

      {saved && (
        <div className="p-3 bg-[#2E6B34]/10 text-[#2E6B34] border border-[#2E6B34]/30 rounded text-xs font-bold">
          Statutory governance parameters successfully committed!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-[#D8D2C4] rounded p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-[#12181F] border-b border-[#D8D2C4] pb-2">Academic Policy Parameters</h3>
        <div>
          <label className="block text-xs uppercase font-bold text-[#6B7280] mb-1">Minimum Examination Attendance Threshold (%) *</label>
          <input type="text" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] font-mono" />
        </div>
        <div>
          <label className="block text-xs uppercase font-bold text-[#6B7280] mb-1">QR Session Expiry Window (Minutes) *</label>
          <input type="text" value={graceMinutes} onChange={(e) => setGraceMinutes(e.target.value)} className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] font-mono" />
        </div>

        <button type="submit" className="px-5 py-2.5 bg-[#9E3D24] text-white text-xs font-bold rounded cursor-pointer hover:bg-[#83311C]">
          Save Governance Policy
        </button>
      </form>
    </div>
  );
}
