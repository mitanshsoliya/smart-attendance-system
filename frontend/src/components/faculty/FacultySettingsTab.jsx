import React, { useState } from "react";

export function FacultySettingsTab({ user }) {
  const [department, setDepartment] = useState("Department of Computer Science & Engineering");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

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

      <form onSubmit={handleSave} className="bg-surface-bright border border-border-default rounded p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-primary border-b border-border-default pb-2">Faculty Profile</h3>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Full Name</label>
          <input type="text" disabled value={user?.full_name || "Dr. Faculty"} className="w-full p-2.5 bg-surface-container border border-border-default rounded text-sm text-text-stone" />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Email</label>
          <input type="email" disabled value={user?.email || "faculty@example.com"} className="w-full p-2.5 bg-surface-container border border-border-default rounded text-sm text-text-stone" />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Department</label>
          <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary" />
        </div>
        <div>
          <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Designation</label>
          <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary" />
        </div>

        <button type="submit" className="px-5 py-2.5 bg-secondary text-on-secondary text-xs font-bold rounded cursor-pointer">
          Save Preferences
        </button>
      </form>
    </div>
  );
}
