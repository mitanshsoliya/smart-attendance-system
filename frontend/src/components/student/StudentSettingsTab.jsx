import React, { useState, useEffect } from "react";
import { authService } from "../../services/authService";

export function StudentSettingsTab({ user, token }) {
  const [profile, setProfile] = useState(null);
  const [studentPhone, setStudentPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [contactMsg, setContactMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (token) {
      authService.getStudentProfile(token).then((res) => {
        if (res?.profile) {
          setProfile(res.profile);
          setStudentPhone(res.profile.studentPhone || "");
          setParentPhone(res.profile.parentPhone || "");
        }
      }).catch((err) => {
        console.error("Failed to load student profile:", err);
      });
    }
  }, [token]);

  const handleContactUpdate = async (e) => {
    e.preventDefault();
    setContactMsg("");
    setSavingContact(true);
    try {
      await authService.updateStudentProfile(
        { student_phone: studentPhone, parent_phone: parentPhone },
        token
      );
      setContactMsg("Contact information updated successfully in institutional database!");
      // Refresh profile data
      const refreshed = await authService.getStudentProfile(token);
      if (refreshed?.profile) setProfile(refreshed.profile);
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
    try {
      await authService.changePassword(currentPassword, newPassword, token);
      setPasswordMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || "Failed to update password.");
    }
  };

  const nameToDisplay = profile?.fullName || user?.full_name || "Student";
  const emailToDisplay = profile?.email || user?.email || "student@example.com";
  const rollToDisplay = profile?.rollNumber || user?.profile?.roll_number || user?.roll_number || "2024-CSE-001";
  const sectionToDisplay = profile?.section || user?.profile?.section || user?.section || "Sec A";
  const deptToDisplay = profile?.department || user?.profile?.department || "Department of Computer Science & Engineering";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="border-b border-[#D8D2C4] pb-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
          STUDENT PORTAL • ACCREDITATION PROFILE & SECURITY
        </span>
        <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">Student Profile & Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Review institutional cohort data, manage personal contact numbers, and update access credentials.
        </p>
      </div>

      {/* Institutional Profile Dossier Card */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8D2C4] pb-3">
          <h3 className="font-serif text-lg font-bold text-[#12181F]">Academic & Cohort Information</h3>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-[#F3EFE6] text-[#9E3D24] border border-[#D8D2C4] rounded">
            ROSTER VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#FBF9F5] rounded border border-[#D8D2C4]/60">
            <span className="text-[#6B7280] block font-mono text-[10px] uppercase font-bold">Candidate Full Name</span>
            <strong className="text-sm text-[#12181F] mt-0.5 block">{nameToDisplay}</strong>
          </div>
          <div className="p-3 bg-[#FBF9F5] rounded border border-[#D8D2C4]/60">
            <span className="text-[#6B7280] block font-mono text-[10px] uppercase font-bold">Institutional Email</span>
            <strong className="text-sm text-[#12181F] mt-0.5 block">{emailToDisplay}</strong>
          </div>
          <div className="p-3 bg-[#FBF9F5] rounded border border-[#D8D2C4]/60">
            <span className="text-[#6B7280] block font-mono text-[10px] uppercase font-bold">Enrollment No. / Roll Number</span>
            <strong className="text-sm font-mono text-[#9E3D24] mt-0.5 block">{rollToDisplay}</strong>
          </div>
          <div className="p-3 bg-[#FBF9F5] rounded border border-[#D8D2C4]/60">
            <span className="text-[#6B7280] block font-mono text-[10px] uppercase font-bold">Cohort Section</span>
            <strong className="text-sm text-[#12181F] mt-0.5 block">{sectionToDisplay}</strong>
          </div>
          <div className="md:col-span-2 p-3 bg-[#FBF9F5] rounded border border-[#D8D2C4]/60">
            <span className="text-[#6B7280] block font-mono text-[10px] uppercase font-bold">Department</span>
            <strong className="text-sm text-[#12181F] mt-0.5 block">{deptToDisplay}</strong>
          </div>
        </div>
      </div>

      {/* Editable Contact Numbers Form */}
      <form onSubmit={handleContactUpdate} className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs space-y-4">
        <div className="border-b border-[#D8D2C4] pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#12181F]">Emergency & Personal Contact Information</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Students may update personal & parent contact numbers registered in university database.</p>
          </div>
        </div>

        {contactMsg && (
          <div className={`p-3 text-xs font-semibold rounded border-l-4 ${contactMsg.includes("successfully") ? "bg-[#2E6B34]/10 border-[#2E6B34] text-[#2E6B34]" : "bg-[#BA1A1A]/10 border-[#BA1A1A] text-[#BA1A1A]"}`}>
            {contactMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#555E68] uppercase mb-1">
              Student Contact No.
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#555E68] uppercase mb-1">
              Parents / Guardian Contact No.
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98123 45678"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingContact}
          className="px-5 py-2.5 bg-[#9E3D24] text-white text-xs font-bold rounded hover:bg-[#83311C] transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {savingContact ? "Saving to Database..." : "Save Contact Information"}
        </button>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handlePasswordChange} className="bg-[#FFFFFF] border border-[#D8D2C4] rounded p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#12181F] border-b border-[#D8D2C4] pb-2">Change Password Credentials</h3>
        
        {passwordMsg && (
          <div className={`p-3 text-xs font-semibold rounded border-l-4 ${passwordMsg.includes("successfully") ? "bg-[#2E6B34]/10 border-[#2E6B34] text-[#2E6B34]" : "bg-[#BA1A1A]/10 border-[#BA1A1A] text-[#BA1A1A]"}`}>
            {passwordMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono font-bold text-[#555E68] uppercase mb-1">Current Password *</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold text-[#555E68] uppercase mb-1">New Password *</label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold text-[#555E68] uppercase mb-1">Confirm New Password *</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#1C242E] text-white text-xs font-bold rounded hover:bg-[#12181F] transition-all cursor-pointer shadow-xs"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
