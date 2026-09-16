import React, { useState, useEffect } from "react";
import api from "../services/api";
import { RegistrationRequestModal } from "./common/RegistrationRequestModal";

export default function Login({ onLogin, sessionNotice, onClearNotice }) {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("lecturelog_saved_email") || "";
  });
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
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
          setMessage(`Access Denied: This account has the '${accountRole}' role. Please switch to the correct portal to sign in.`);
        } else {
          setMessage(`Access Denied: This account has the '${accountRole}' role. HOD portal is restricted to Department Heads.`);
        }
        return;
      }

      // If backend issued or verified a device token for student, persist it securely
      if (data.device_token) {
        localStorage.setItem("lecturelog_device_token", data.device_token);
      }

      localStorage.setItem("lecturelog_saved_email", email.trim());
      onLogin(data);
    } catch (error) {
      const errRes = error.response?.data;
      if (error.response?.status === 403 && errRes?.code === "DEVICE_NOT_AUTHORIZED") {
        setMessage(
          errRes.message ||
            "Your account is registered on another device. Please contact the HOD/admin to verify or reset your registered device."
        );
      } else {
        setMessage(
          errRes?.message || "Invalid credentials or unable to connect to the server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#1C1C1A] flex items-center justify-center p-2.5 sm:p-6 lg:p-8 selection:bg-[#BA5D3B]/20 selection:text-[#BA5D3B]">
      {/* Main Container Card matching user image */}
      <div className="w-full max-w-5xl bg-white rounded-xl sm:rounded-[28px] shadow-2xl border border-[#EBE6DE] overflow-hidden flex flex-col lg:flex-row my-auto transition-all">
        
        {/* ========================================================
            LEFT COLUMN: BRAND HERO, TEXT & CLASSROOM ILLUSTRATION
           ======================================================== */}
        <div className="w-full lg:w-1/2 bg-[#F9F6F0] p-5 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#EBE6DE] select-none">
          <div>
            {/* Logo Header matching image */}
            <div className="flex items-center gap-3">
              {/* Custom SVG Open Book with Clock on right page */}
              <svg className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left book leaf */}
                <path d="M10 44C17 40 25 40 30 44V18C25 14 17 14 10 18V44Z" stroke="#BA5D3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="#FAF7F2"/>
                {/* Left bottom layer */}
                <path d="M10 47C17 43 25 43 30 47" stroke="#BA5D3B" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Right book leaf */}
                <path d="M34 44C39 40 47 40 54 44V18C47 14 39 14 34 18V44Z" stroke="#BA5D3B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="#FAF7F2"/>
                {/* Right bottom layer */}
                <path d="M34 47C41 43 49 43 54 47" stroke="#BA5D3B" strokeWidth="2.5" strokeLinecap="round"/>
                {/* Clock badge on right page */}
                <circle cx="44" cy="28" r="9" fill="#FAF7F2" stroke="#BA5D3B" strokeWidth="3" />
                <path d="M44 23V28L47.5 30.5" stroke="#BA5D3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1C1A] leading-none">
                  LectureLog
                </h1>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#BA5D3B] uppercase tracking-[0.2em] mt-1">
                  SMART ATTENDANCE SUITE
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-xl sm:text-2xl lg:text-4xl text-[#1C1C1A] font-bold leading-[1.25] mt-4 sm:mt-6 lg:mt-9 mb-2 sm:mb-3 tracking-tight">
              Track Lectures,<br />
              Manage Attendance<br />
              Effortlessly
            </h2>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-[#6F6B63] leading-relaxed max-w-sm mb-3 sm:mb-6 hidden sm:block">
              A simple and secure platform for faculties and students to manage attendance using smart tools.
            </p>

            {/* 3 Feature Bullets */}
            <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-8 text-xs sm:text-sm text-[#2E2B27] font-medium hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-[#2E2B27]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>Secure Access</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-[#2E2B27]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>Role Based Dashboard</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-[#2E2B27]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Real-time Attendance</span>
              </div>
            </div>
          </div>

          {/* Classroom Illustration in bottom area - shown on desktop for sleek visual balance */}
          <div className="mt-auto overflow-hidden rounded-2xl border border-[#E5E0D8]/60 shadow-sm bg-[#FAF8F5] hidden lg:block">
            <img
              src="/classroom_illustration.jpg"
              alt="Classroom Lecture"
              className="w-full h-48 sm:h-52 lg:h-56 object-cover object-center"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: WELCOME BACK & LOGIN FORM
           ======================================================== */}
        <div className="w-full lg:w-1/2 bg-white p-4 sm:p-8 lg:p-12 flex flex-col justify-center">
          
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="font-serif text-2xl sm:text-4xl text-[#1C1C1A] font-bold tracking-tight mb-1">
              Welcome Back
            </h2>
            <p className="text-xs sm:text-sm text-[#6F6B63]">
              Sign in to your LectureLog account
            </p>
          </div>

          {/* Select Your Role Segmented Container */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-[#6F6B63] uppercase tracking-wider mb-2.5">
              SELECT YOUR ROLE
            </label>
            <div className="grid grid-cols-3 p-1 sm:p-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl gap-1">
              {[
                {
                  key: "STUDENT",
                  label: "Student",
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  key: "FACULTY",
                  label: "Faculty",
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  ),
                },
                {
                  key: "HOD",
                  label: "HOD",
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
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
                  className={`flex flex-col items-center justify-center py-2 px-1 sm:py-2.5 sm:px-2 rounded-lg transition-all cursor-pointer ${
                    role === item.key
                      ? "bg-[#BA5D3B] text-white shadow-sm"
                      : "text-[#6F6B63] hover:text-[#1C1C1A] hover:bg-white/60 bg-transparent"
                  }`}
                >
                  <div className="mb-0.5 sm:mb-1">{item.icon}</div>
                  <span className="text-[11px] sm:text-xs font-semibold truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notices */}
          {sessionNotice && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
              <span className="leading-relaxed">{sessionNotice}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">error</span>
              <span className="leading-relaxed">{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[#6F6B63] uppercase tracking-wider" htmlFor="email">
                EMAIL
              </label>
              <div className="relative rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] focus-within:border-[#BA5D3B] focus-within:ring-1 focus-within:ring-[#BA5D3B] flex items-center px-3.5 py-3 transition-all">
                <span className="text-[#6F6B63] flex items-center mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full bg-transparent border-none outline-none text-base sm:text-sm text-[#1C1C1A] placeholder:text-[#969189]"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[#6F6B63] uppercase tracking-wider" htmlFor="password">
                PASSWORD
              </label>
              <div className="relative rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] focus-within:border-[#BA5D3B] focus-within:ring-1 focus-within:ring-[#BA5D3B] flex items-center px-3.5 py-3 transition-all">
                <span className="text-[#6F6B63] flex items-center mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent border-none outline-none text-base sm:text-sm text-[#1C1C1A] placeholder:text-[#969189]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#6F6B63] hover:text-[#1C1C1A] transition-colors ml-2 cursor-pointer p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-3 px-4 bg-[#BA5D3B] hover:bg-[#A34F30] active:scale-[0.99] text-white rounded-xl font-medium text-base transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </span>
              ) : (
                <>
                  <span>Log in</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>


          {/* OR Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-[#E5E0D8]"></div>
            <span className="absolute bg-white px-3 text-xs font-semibold text-[#969189] uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Registration Trigger */}
          <div className="text-center space-y-1">
            <p className="text-xs text-[#6F6B63]">New user?</p>
            <button
              type="button"
              onClick={() => {
                setRegisterModalRole(role === "STUDENT" ? "STUDENT" : "FACULTY");
                setShowRegisterModal(true);
              }}
              className="text-sm font-bold text-[#BA5D3B] hover:underline cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-1 transition-colors"
            >
              <span>Register here</span>
              <span>→</span>
            </button>
            <p className="text-[11px] text-[#969189]">
              (Faculty Registration / Student Registration)
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
