import React, { useState } from "react";

export function StudentSettingsTab({ user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    setMessage("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Account & Security Settings</h1>
        <p className="text-sm text-text-stone mt-1">Manage profile information and password credentials.</p>
      </div>

      {message && (
        <div className="p-3 bg-surface-container border-l-4 border-secondary text-xs text-primary font-semibold">
          {message}
        </div>
      )}

      <div className="bg-surface-bright border border-border-default rounded p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-primary border-b border-border-default pb-2">Student Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div><span className="text-text-stone block">Full Name</span><strong className="text-sm text-primary">{user?.full_name || "Student"}</strong></div>
          <div><span className="text-text-stone block">Institutional Email</span><strong className="text-sm text-primary">{user?.email || "student@example.com"}</strong></div>
          <div><span className="text-text-stone block">Roll Number</span><strong className="text-sm font-mono text-primary">{user?.roll_number || "2024-CSE-001"}</strong></div>
          <div><span className="text-text-stone block">Section</span><strong className="text-sm text-primary">{user?.section || "Sec A"}</strong></div>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="bg-surface-bright border border-border-default rounded p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-primary border-b border-border-default pb-2">Change Password</h3>
        <div>
          <label className="block text-xs font-semibold text-text-stone uppercase mb-1">Current Password *</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-stone uppercase mb-1">New Password *</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-stone uppercase mb-1">Confirm New Password *</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border-default rounded text-sm text-primary"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-secondary text-on-secondary text-xs font-bold rounded hover:opacity-90 cursor-pointer"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
