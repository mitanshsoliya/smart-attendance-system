import React, { useState, useEffect } from "react";
import api, { authHeader } from "../../services/api";

const DEPARTMENTS = [
  "Department of Computer Science & Engineering",
  "Department of Information Technology",
  "Department of Electronics & Communication",
];

const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Visiting Faculty",
];


export function FacultySettingsTab({ user, onProfileUpdate }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [department, setDepartment] = useState(user?.profile?.department || user?.department || "Department of Computer Science & Engineering");
  const [designation, setDesignation] = useState(user?.profile?.designation || "Assistant Professor");
  const [phone, setPhone] = useState(user?.profile?.phone || user?.profile?.contactNo || "");
  const [savedNotice, setSavedNotice] = useState(false);
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
          setDepartment(p.department || "Department of Computer Science & Engineering");
          setDesignation(p.designation || "Assistant Professor");
          setPhone(p.phone || p.contactNo || "");
        }
      })
      .catch((err) => console.error("Failed to fetch faculty profile:", err))
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
          department: department.trim(),
          designation: designation.trim(),
          phone: phone.trim(),
        },
        authHeader(token)
      );
      if (res.data?.profile) {
        const p = res.data.profile;
        setFullName(p.fullName || fullName);
        setDepartment(p.department || department);
        setDesignation(p.designation || designation);
        setPhone(p.phone || p.contactNo || phone);
      }
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
      // Refresh user data everywhere in the app
      if (onProfileUpdate) {
        try { await onProfileUpdate(); } catch (_) { /* ignore */ }
      }
    } catch (err) {
      console.error("Failed to update faculty profile:", err);
      setErrorNotice(err.response?.data?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="border-b border-border-default pb-4">
          <h1 className="font-serif-display text-3xl text-primary font-bold">Faculty Preferences & Settings</h1>
          <p className="text-sm text-text-stone mt-1">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Faculty Preferences & Settings</h1>
        <p className="text-sm text-text-stone mt-1">Configure profile details and academic department settings.</p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-surface-container border-l-4 border-secondary text-xs text-primary font-semibold">
          Preferences saved successfully!
        </div>
      )}
      {errorNotice && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 font-semibold">
          {errorNotice}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-surface-bright border border-border-default rounded p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-primary border-b border-border-default pb-2">Faculty Profile</h3>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Full Name</label>
          <input type="text" disabled value={user?.full_name || fullName} className="w-full p-2.5 bg-surface-container border border-border-default rounded text-sm text-text-stone" />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Email</label>
          <input type="email" disabled value={user?.email || "faculty@example.com"} className="w-full p-2.5 bg-surface-container border border-border-default rounded text-sm text-text-stone" />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
          />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary cursor-pointer"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Designation</label>
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary cursor-pointer"
          >
            {DESIGNATIONS.map((desig) => (
              <option key={desig} value={desig}>{desig}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-secondary text-on-secondary text-xs font-bold rounded cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </button>
      </form>
    </div>
  );
}
