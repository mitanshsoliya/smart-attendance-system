import React, { useState, useEffect } from "react";
import api, { authHeader } from "../../services/api";
import { ThemeToggle } from "../common/ThemeToggle";

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
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/faculty/profile", authHeader(token))
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
      if (onProfileUpdate) {
        try {
          await onProfileUpdate();
        } catch (_) {
          /* ignore */
        }
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
        <div className="border-b border-border-default pb-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Department Governance & Settings
          </h1>
          <p className="text-sm text-text-stone mt-1">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="border-b border-border-default pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              EXECUTIVE PROFILE
            </span>
            <span className="text-xs text-text-stone">Administrative Settings</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Department Governance & Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-stone mt-0.5">
            Configure HOD administrative profile and departmental alert contact numbers.
          </p>
        </div>

        {saved && (
          <div className="mt-4 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span>Profile updated successfully!</span>
          </div>
        )}

        {errorNotice && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-rose-600">error</span>
            <span>{errorNotice}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary mb-1">Full Name</label>
            <input
              type="text"
              disabled
              value={user?.full_name || fullName}
              className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-text-stone cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-primary mb-1">Institutional Email</label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-text-stone cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-primary mb-1">Phone Contact Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full p-2.5 bg-white border border-border-default rounded-xl text-sm text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer text-center"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>

      {/* Appearance & Theme Preferences */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-border-default pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">palette</span>
            </span>
            <div>
              <h3 className="font-heading text-base font-bold text-primary">
                Appearance & Theme Preferences
              </h3>
              <p className="text-xs text-text-stone">
                Select your preferred visual mode for HOD management console and analytics.
              </p>
            </div>
          </div>
        </div>

        <ThemeToggle variant="card" />
      </div>
    </div>
  );
}
