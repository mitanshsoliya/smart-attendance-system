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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn z-10 min-w-0">
        {/* Header with University Branding & Role Toggle */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Campus Onboarding Portal
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tracking-tight">
                {isStudent ? "Candidate Student Registration" : "Faculty Member Registration"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/60 transition-colors text-base font-bold cursor-pointer shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Role Pill Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl gap-1 mt-3">
            <button
              type="button"
              onClick={() => {
                setRole("STUDENT");
                setError("");
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isStudent
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Student Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("FACULTY");
                setError("");
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isStudent
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Faculty Member</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-w-0">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-rose-600">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
              <span>{success}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
              {isStudent ? "Candidate Full Name *" : "Faculty Full Name *"}
            </label>
            <input
              type="text"
              required
              placeholder={isStudent ? "e.g. Rahul Sharma" : "e.g. Dr. Priya Sharma"}
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Institutional Email */}
          <div>
            <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
              Institutional Email *
            </label>
            <input
              type="email"
              required
              placeholder={isStudent ? "e.g. rahul.sharma@univ.edu" : "e.g. priya.sharma@univ.edu"}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          {isStudent ? (
            <>
              {/* Row: Roll Number & Cohort Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
                    Enrollment No. / Roll No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-CSE-101"
                    value={form.rollNumber}
                    onChange={(e) => handleChange("rollNumber", e.target.value)}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Cohort Section</span>
                    <span className="text-[10px] text-blue-600 font-semibold lowercase">HOD assigned</span>
                  </label>
                  <div className="w-full p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-1.5 font-medium select-none">
                    <span className="material-symbols-outlined text-[15px] text-slate-500">lock</span>
                    <span className="font-semibold text-slate-800">Designated by Department HOD</span>
                  </div>
                </div>
              </div>

              {/* Row: Student Contact & Parents Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
                    Student Contact No.
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={form.studentPhone}
                    onChange={(e) => handleChange("studentPhone", e.target.value)}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
                    Parents Contact No.
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98123 45678"
                    value={form.parentPhone}
                    onChange={(e) => handleChange("parentPhone", e.target.value)}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Row: Employee ID & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
                    Employee ID / Faculty Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC-2026-08"
                    value={form.employeeId}
                    onChange={(e) => handleChange("employeeId", e.target.value)}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
                    Designation *
                  </label>
                  <select
                    value={form.designation}
                    onChange={(e) => handleChange("designation", e.target.value)}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
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
                <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
                  Faculty Contact No.
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
            </>
          )}

          {/* Academic Department */}
          <div>
            <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
              Academic Department *
            </label>
            <select
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
              className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
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
            <label className="block uppercase text-[10px] font-bold text-slate-500 tracking-wider mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="Create a secure account password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Buttons Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Request to HOD</span>
                  <span className="material-symbols-outlined text-[15px]">send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

