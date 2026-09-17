import React, { useState, useEffect } from "react";
import api from "../services/api";
import { RegistrationRequestModal } from "./common/RegistrationRequestModal";

export default function Login({ onLogin, sessionNotice, onClearNotice }) {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("lecturelog_saved_email") || "";
  });
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerModalRole, setRegisterModalRole] = useState("STUDENT");

  // Clear notice when credentials change
  useEffect(() => {
    if (message) setMessage("");
  }, [email, password, role]);

  const submit = async (event) => {
    event.preventDefault();
    if (onClearNotice) onClearNotice();
    setLoading(true);
    setMessage("");

    try {
      const savedDeviceToken = localStorage.getItem("lecturelog_device_token");
      const payload = {
        email: email.trim(),
        password: password.trim(),
      };
      if (savedDeviceToken) {
        payload.device_token = savedDeviceToken;
      }

      const { data } = await api.post("/login", payload);

      const accountRole = (data.user?.role || "").toUpperCase();
      const selectedRole = role.toUpperCase();

      if (selectedRole !== accountRole) {
        if (selectedRole === "STUDENT") {
          setMessage(`Access Denied: This account has the '${accountRole}' role. You cannot log in through the Student portal.`);
        } else if (selectedRole === "FACULTY") {
          setMessage(`Access Denied: This account has the '${accountRole}' role. Please switch to the Faculty portal to sign in.`);
        } else {
          setMessage(`Access Denied: This account has the '${accountRole}' role. HOD portal is restricted to Department Heads.`);
        }
        return;
      }

      // If backend issued or verified a device token for student, persist it securely
      if (data.device_token) {
        localStorage.setItem("lecturelog_device_token", data.device_token);
      }

      if (rememberMe) {
        localStorage.setItem("lecturelog_saved_email", email.trim());
      } else {
        localStorage.removeItem("lecturelog_saved_email");
      }

      onLogin(data);
    } catch (error) {
      const errRes = error.response?.data;
      if (error.response?.status === 403 && errRes?.code === "DEVICE_NOT_AUTHORIZED") {
        setMessage(
          errRes.message ||
            "Your account is registered on another device. Please contact your HOD/administrator to verify or reset your registered device binding."
        );
      } else {
        setMessage(
          errRes?.message || "Invalid credentials or unable to connect to the campus server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Main Authentication Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col lg:flex-row my-auto transition-all">
        
        {/* ========================================================
            LEFT COLUMN: UNIVERSITY BRANDING & CAMPUS HERO
           ======================================================== */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#0B2448] via-[#123B73] to-[#1E3A8A] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Subtle Background Geometric Accents */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

          <div className="relative z-10">
            {/* University Crest & Brand Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
                <span className="material-symbols-outlined text-2xl text-blue-300">account_balance</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-none">
                  Smart Attendance System
                </h1>
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-1">
                  CAMPUS MANAGEMENT SUITE
                </p>
              </div>
            </div>

            {/* Tagline & Core Proposition */}
            <div className="mb-8">
              <span className="inline-block text-[11px] font-mono uppercase font-bold text-blue-300 tracking-wider mb-2">
                SMART CAMPUS • BETTER ATTENDANCE
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                Secure. Connected.<br />
                Data-driven.
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed mt-3 max-w-md hidden sm:block">
                An institutional campus management platform designed for university-wide attendance tracking, timetable governance, and accreditation reporting.
              </p>
            </div>

            {/* 4 Feature Highlights */}
            <div className="space-y-3 mb-6 hidden sm:block">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50/90 font-medium">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                </div>
                <span>QR Based Attendance (Anti-Proxy Session Codes)</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50/90 font-medium">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                </div>
                <span>Real-time GPS Geo-Fence Classroom Verification</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50/90 font-medium">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                </div>
                <span>Secure Role Access for Student, Faculty & HOD</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50/90 font-medium">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">insights</span>
                </div>
                <span>Statutory Attendance Analytics & Clearance Audits</span>
              </div>
            </div>
          </div>

          {/* Bottom Illustration or Status Badge */}
          <div className="relative z-10 mt-auto pt-4 border-t border-white/10 hidden lg:flex items-center justify-between text-xs text-blue-200/80 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>NBA Tier-1 Governance Active</span>
            </span>
            <span>AY 2026–27</span>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: AUTHENTICATION FORM & ROLE TABS
           ======================================================== */}
        <div className="w-full lg:w-1/2 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              University Attendance & Academic Workspace Portal
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              SELECT YOUR PORTAL
            </label>
            <div className="grid grid-cols-3 p-1 bg-slate-100/90 border border-slate-200 rounded-xl gap-1">
              {[
                {
                  key: "STUDENT",
                  label: "Student",
                  icon: "school",
                },
                {
                  key: "FACULTY",
                  label: "Faculty",
                  icon: "person",
                },
                {
                  key: "HOD",
                  label: "HOD",
                  icon: "account_balance",
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRole(item.key);
                    if (onClearNotice) onClearNotice();
                    setMessage("");
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                    role === item.key
                      ? "bg-primary text-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 bg-transparent font-semibold"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] mb-0.5">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notices */}
          {sessionNotice && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">warning</span>
              <span className="leading-relaxed">{sessionNotice}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-rose-600 shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed">{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            
            {/* Email / Enrollment Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="email">
                Institutional Email or Enrollment ID
              </label>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 flex items-center px-3.5 py-3 transition-all">
                <span className="text-slate-400 flex items-center mr-3">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. strivedi.cse@univ.edu"
                  className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Please contact your Department Administrator or HOD office to reset your password.")}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/60 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 flex items-center px-3.5 py-3 transition-all">
                <span className="text-slate-400 flex items-center mr-3">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition-colors ml-2 cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none mb-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Remember my credentials</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark active:scale-[0.99] text-white rounded-xl font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Verifying Session...</span>
                </span>
              ) : (
                <>
                  <span>Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-slate-200"></div>
            <span className="absolute bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              NEW CANDIDATE REGISTRATION
            </span>
          </div>

          {/* Registration Trigger */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500">Not enrolled in the campus directory?</p>
            <button
              type="button"
              onClick={() => {
                setRegisterModalRole(role === "STUDENT" ? "STUDENT" : "FACULTY");
                setShowRegisterModal(true);
              }}
              className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1 transition-colors"
            >
              <span>Submit Onboarding Request to Department HOD</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <p className="text-[11px] text-slate-400">
              (Candidate Student Self-Registration / Faculty Member Onboarding)
            </p>
          </div>
        </div>
      </div>

      {/* Registration Request Modal */}
      <RegistrationRequestModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        initialRole={registerModalRole}
      />
    </div>
  );
}

