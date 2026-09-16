import React, { useState, useEffect } from "react";
import api, { authHeader } from "../../services/api";

export function HodSettingsTab({ user, onProfileUpdate }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.profile?.phone || user?.profile?.contactNo || "");
  const [saved, setSaved] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch latest profile from backend on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    api.get("/faculty/profile", authHeader(token))
      .then((res) => {
        const p = res.data?.profile;
        if (p) {
          setFullName(p.fullName || user?.full_name || "");
          setPhone(p.phone || p.contactNo || "");
        }
      })
      .catch((err) => console.error("Failed to fetch HOD profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorNotice("");
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        "/faculty/profile",
        {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
        authHeader(token)
      );
      if (res.data?.profile) {
        const p = res.data.profile;
        setFullName(p.fullName || fullName);
        setPhone(p.phone || p.contactNo || phone);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Refresh user data everywhere in the app
      if (onProfileUpdate) {
        try { await onProfileUpdate(); } catch (_) { /* ignore */ }
      }
    } catch (err) {
      console.error("Failed to update HOD profile:", err);
      setErrorNotice(err.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="border-b border-[#D8D2C4] pb-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#12181F]">Department Governance & Settings</h1>
          <p className="text-sm text-[#6B7280] mt-1">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-[#D8D2C4] pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#12181F]">Department Governance & Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">Configure HOD profile details.</p>
      </div>

      {saved && (
        <div className="p-3 bg-[#2E6B34]/10 text-[#2E6B34] border border-[#2E6B34]/30 rounded text-xs font-bold">
          Profile updated successfully!
        </div>
      )}
      {errorNotice && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 font-semibold">
          {errorNotice}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-[#D8D2C4] rounded p-4 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-[#12181F] border-b border-[#D8D2C4] pb-2">HOD Profile</h3>
        <div>
          <label className="block text-xs uppercase font-bold text-[#6B7280] mb-1">Full Name</label>
          <input type="text" disabled value={user?.full_name || fullName} className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#6B7280]" />
        </div>
        <div>
          <label className="block text-xs uppercase font-bold text-[#6B7280] mb-1">Email</label>
          <input type="email" disabled value={user?.email || ""} className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#6B7280]" />
        </div>
        <div>
          <label className="block text-xs uppercase font-bold text-[#6B7280] mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#9E3D24] text-white text-xs font-bold rounded cursor-pointer hover:bg-[#83311C] disabled:opacity-50 text-center"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
