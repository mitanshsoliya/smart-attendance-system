import React, { useState, useEffect } from "react";
import { hodService } from "../../services/hodService";

export function RegistrationRequestModal({ isOpen, onClose, initialRole = "STUDENT" }) {
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    rollNumber: "",
    section: "Pending HOD Allocation",
    studentPhone: "",
    parentPhone: "",
    employeeId: "",
    designation: "Assistant Professor",
    phone: "",
    department: "Department of Computer Science & Engineering",
  });

  // Sync role and reset form whenever modal opens or initialRole changes
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole || "STUDENT");
      setError("");
      setSuccess("");
      setForm({
        fullName: "",
        email: "",
        password: "",
        rollNumber: "",
        section: "Pending HOD Allocation",
        studentPhone: "",
        parentPhone: "",
        employeeId: "",
        designation: "Assistant Professor",
        phone: "",
        department: "Department of Computer Science & Engineering",
      });
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        role,
      };

      const res = await hodService.submitRegistrationRequest(payload);
      setSuccess(
        res.message ||
          "Registration request sent successfully! Your request is pending HOD verification."
      );
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Submission error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit registration request. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const isStudent = role === "STUDENT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs font-body">
      <div className="bg-white border border-[#D8D2C4] rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn min-w-0">
        {/* Header matching Image 3 with Role Selector */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[#D8D2C4] bg-[#FBF9F5] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif-display text-base sm:text-xl font-bold text-[#12181F] truncate">
                {isStudent ? "Onboard Candidate Student" : "Register Faculty Member"}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono text-[#9E3D24] uppercase tracking-wider font-bold mt-0.5 truncate">
                {isStudent
                  ? "Student Self-Registration Request • HOD Verification"
                  : "Faculty Self-Registration Request • HOD Verification"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#12181F] p-1.5 rounded transition-colors text-lg font-bold cursor-pointer shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-w-0">
          {error && (
            <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] text-[#9B1C1C] text-xs rounded font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-[#DEF7EC] border border-[#BCF0DA] text-[#03543F] text-xs rounded font-medium">
              ✓ {success}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
              {isStudent ? "Candidate Full Name *" : "Faculty Full Name *"}
            </label>
            <input
              type="text"
              required
              placeholder={isStudent ? "e.g. Rahul Sharma" : "e.g. Dr. Priya Sharma"}
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
            />
          </div>

          {/* Institutional Email */}
          <div>
            <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
              Institutional Email *
            </label>
            <input
              type="email"
              required
              placeholder={isStudent ? "e.g. rahul.sharma@univ.edu" : "e.g. priya.sharma@univ.edu"}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
            />
          </div>

          {isStudent ? (
            <>
              {/* Row: Roll Number & Cohort Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
                    Enrollment No. / Roll No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-CSE-101"
                    value={form.rollNumber}
                    onChange={(e) => handleChange("rollNumber", e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1 flex items-center justify-between">
                    <span>Cohort Section</span>
                    <span className="text-[10px] text-[#9E3D24] font-semibold lowercase font-mono">HOD assigned</span>
                  </label>
                  <div className="w-full p-2.5 bg-[#F3EFE6]/70 border border-[#D8D2C4] rounded text-xs text-[#555E68] flex items-center gap-1.5 font-medium select-none">
                    <span className="material-symbols-outlined text-[15px] text-[#9E3D24]">lock</span>
                    <span className="font-semibold text-[#12181F]">Assigned by Department HOD</span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-1 leading-tight">
                    Section will be designated by your Department HOD upon admission review.
                  </p>
                </div>
              </div>

              {/* Row: Student Contact & Parents Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
                    Student Contact No.
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={form.studentPhone}
                    onChange={(e) => handleChange("studentPhone", e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
                    Parents Contact No.
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98123 45678"
                    value={form.parentPhone}
                    onChange={(e) => handleChange("parentPhone", e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Row: Employee ID & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
                    Employee ID / Faculty Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC-2026-08"
                    value={form.employeeId}
                    onChange={(e) => handleChange("employeeId", e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
                    Designation *
                  </label>
                  <select
                    value={form.designation}
                    onChange={(e) => handleChange("designation", e.target.value)}
                    className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Visiting Faculty">Visiting Faculty</option>
                  </select>
                </div>
              </div>

              {/* Contact No */}
              <div>
                <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
                  Faculty Contact No.
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
                />
              </div>
            </>
          )}

          {/* Academic Department */}
          <div>
            <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
              Academic Department *
            </label>
            <select
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
            >
              <option value="Department of Computer Science & Engineering">
                Department of Computer Science & Engineering (CSE)
              </option>
              <option value="Department of Information Technology">
                Department of Information Technology (IT)
              </option>
              <option value="Department of Electronics & Communication">
                Department of Electronics & Communication (ECE)
              </option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block uppercase text-[11px] font-bold text-[#6B7280] tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="Create a strong account password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="w-full p-2.5 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-[#D8D2C4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F3EFE6] hover:bg-[#EBE5DA] text-[#12181F] font-bold text-xs rounded transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="px-5 py-2 bg-[#9E3D24] hover:bg-[#83311C] text-white font-bold text-xs rounded transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Sending Request...</span>
                </>
              ) : (
                <span>Send Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
