import React, { useState, useEffect } from "react";
import { authService } from "../../services/authService";

export function StudentSettingsTab({ user, token }) {
  const [profile, setProfile] = useState(null);
  const [studentPhone, setStudentPhone] = useState(
    user?.profile?.student_phone || user?.profile?.studentPhone || ""
  );
  const [parentPhone, setParentPhone] = useState(
    user?.profile?.parent_phone || user?.profile?.parentPhone || ""
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [contactMsg, setContactMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Read local hardware device token
  const deviceToken = localStorage.getItem("lecturelog_device_token") || "";

  useEffect(() => {
    if (token) {
      authService
        .getStudentProfile(token)
        .then((res) => {
          if (res?.profile) {
            setProfile(res.profile);
            setStudentPhone(res.profile.studentPhone || res.profile.student_phone || "");
            setParentPhone(res.profile.parentPhone || res.profile.parent_phone || "");
          }
        })
        .catch((err) => {
          console.error("Failed to load student profile:", err);
        });
    }
  }, [token]);

  const handleContactUpdate = async (e) => {
    e.preventDefault();
    setContactMsg("");
    setSavingContact(true);
    try {
      const res = await authService.updateStudentProfile(
        {
          student_phone: studentPhone.trim(),
          parent_phone: parentPhone.trim(),
          studentPhone: studentPhone.trim(),
          parentPhone: parentPhone.trim(),
        },
        token
      );
      setContactMsg("Emergency & personal contact numbers successfully updated in institutional database!");

      if (res?.profile) {
        setProfile(res.profile);
        setStudentPhone(res.profile.studentPhone || res.profile.student_phone || "");
        setParentPhone(res.profile.parentPhone || res.profile.parent_phone || "");
      }

      // Sync with localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("user")) || {};
        if (stored) {
          stored.profile = stored.profile || {};
          stored.profile.student_phone = studentPhone.trim();
          stored.profile.parent_phone = parentPhone.trim();
          stored.profile.studentPhone = studentPhone.trim();
          stored.profile.parentPhone = parentPhone.trim();
          localStorage.setItem("user", JSON.stringify(stored));
        }
      } catch {
        // ignore storage serialization error
      }
    } catch (err) {
      setContactMsg(err.response?.data?.message || "Failed to update contact information.");
    } finally {
      setSavingContact(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("New password must be at least 6 characters in length.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword, token);
      setPasswordMsg(res?.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const nameToDisplay = profile?.fullName || user?.full_name || "Student";
  const emailToDisplay = profile?.email || user?.email || "student@example.com";
  const rollToDisplay =
    profile?.rollNumber || user?.profile?.roll_number || user?.roll_number || "2024-CSE-001";
  const sectionToDisplay = profile?.section || user?.profile?.section || user?.section || "Sec A";
  const deptToDisplay =
    profile?.department || user?.profile?.department || "Department of Computer Science & Engineering";
  const currentStdPhone =
    profile?.studentPhone || profile?.student_phone || studentPhone || "Not Provided";
  const currentParPhone =
    profile?.parentPhone || profile?.parent_phone || parentPhone || "Not Provided";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              STUDENT PROFILE & SECURITY
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl text-primary font-bold mt-1">
              Account Settings & Security
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5">
              Review institutional cohort data, manage emergency contact numbers, and view hardware device locks.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Roster Active</span>
          </div>
        </div>
      </div>

      {/* Hardware Device Binding Security Card */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">devices</span>
            </span>
            <div>
              <h3 className="font-heading text-base font-bold text-primary">
                Hardware Device Binding Lock
              </h3>
              <p className="text-xs text-text-stone">Anti-proxy single device security enforcement</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              deviceToken
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {deviceToken ? "Device Bound & Verified" : "No Device Token Registered"}
          </span>
        </div>

        <div className="p-4 bg-surface-container-low rounded-xl border border-border-default text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-text-stone font-medium">Local Hardware Fingerprint:</span>
            <span className="font-mono text-primary font-bold break-all">
              {deviceToken ? deviceToken.slice(0, 24) + "..." : "Generated on first login"}
            </span>
          </div>
          <p className="text-text-stone text-[11px] leading-relaxed pt-2 border-t border-border-default/60">
            <strong>Security Notice:</strong> To eliminate attendance impersonation and proxy QR sharing, your account is bound to this device. If you lose your phone or switch devices, contact your <strong>Head of Department (HOD)</strong> to reset your device binding.
          </p>
        </div>
      </div>

      {/* Institutional Academic Profile Dossier */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </span>
            <div>
              <h3 className="font-heading text-base font-bold text-primary">
                Academic & Cohort Information
              </h3>
              <p className="text-xs text-text-stone">Verified by University Registrar</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-surface-container text-primary rounded-lg">
            COHORT 2024-28
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Student Full Name</span>
            <strong className="text-sm font-bold text-primary mt-0.5 block">{nameToDisplay}</strong>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Institutional Email</span>
            <strong className="text-sm font-medium text-primary mt-0.5 block truncate">{emailToDisplay}</strong>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Roll Number / Enrollment</span>
            <strong className="text-sm font-mono font-bold text-secondary mt-0.5 block">{rollToDisplay}</strong>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Cohort Section</span>
            <strong className="text-sm font-bold text-primary mt-0.5 block">{sectionToDisplay}</strong>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Student Contact No.</span>
            <strong className="text-sm font-mono text-primary mt-0.5 block">{currentStdPhone}</strong>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Parent / Guardian Contact</span>
            <strong className="text-sm font-mono text-secondary mt-0.5 block">{currentParPhone}</strong>
          </div>
          <div className="sm:col-span-2 p-3 bg-surface-container-low rounded-xl border border-border-default/60">
            <span className="text-[10px] uppercase font-bold text-text-stone block">Academic Department</span>
            <strong className="text-sm font-semibold text-primary mt-0.5 block">{deptToDisplay}</strong>
          </div>
        </div>
      </div>

      {/* Editable Contact Numbers Form */}
      <form
        onSubmit={handleContactUpdate}
        className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="border-b border-border-default pb-3 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">contact_phone</span>
          </span>
          <div>
            <h3 className="font-heading text-base font-bold text-primary">
              Emergency & Personal Contact Information
            </h3>
            <p className="text-xs text-text-stone">
              Update phone numbers used for emergency alerts and attendance SMS notifications.
            </p>
          </div>
        </div>

        {contactMsg && (
          <div
            className={`p-3 text-xs font-semibold rounded-xl border ${
              contactMsg.includes("successfully")
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            {contactMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-primary mb-1">
              Student Mobile Contact Number
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary mb-1">
              Parent / Guardian Contact Number
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98123 45678"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingContact}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {savingContact ? "Saving to Database..." : "Save Contact Information"}
        </button>
      </form>

      {/* Password Change Form */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="border-b border-border-default pb-3 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
          </span>
          <div>
            <h3 className="font-heading text-base font-bold text-primary">
              Change Account Password
            </h3>
            <p className="text-xs text-text-stone">
              Ensure your account uses a strong password with at least 6 characters.
            </p>
          </div>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 text-xs font-semibold rounded-xl border ${
              passwordMsg.includes("successfully")
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            {passwordMsg}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-primary mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-primary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={updatingPassword}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {updatingPassword ? "Updating Password..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
