import React from "react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle({ variant = "pill", className = "" }) {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  // 1. Compact Icon Button (for collapsed sidebar or tight spaces)
  if (variant === "compact") {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
          isDark
            ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 hover:border-amber-500/50 shadow-xs"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs"
        } ${className}`}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <span className="material-symbols-outlined text-[20px] transition-transform duration-300 hover:rotate-45">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
      </button>
    );
  }

  // 2. Sidebar Expanded Option (full width row)
  if (variant === "sidebar") {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between border ${
          isDark
            ? "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80"
            : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border-slate-200/70"
        } ${className}`}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle dark and light theme"
      >
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-[18px] ${
              isDark ? "text-amber-400" : "text-indigo-600"
            }`}
          >
            {isDark ? "light_mode" : "dark_mode"}
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isDark ? "Dark Theme" : "Light Theme"}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isDark
              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
          }`}
        >
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  // 3. Settings Cards Variant (for Settings Tabs)
  if (variant === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
        {/* Light Mode Option */}
        <div
          onClick={() => setTheme("light")}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
            !isDark
              ? "border-primary bg-blue-50/50 dark:bg-blue-950/20 shadow-xs"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              !isDark ? "bg-amber-100 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">light_mode</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Mode</p>
              {!isDark && (
                <span className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20"></span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Clean white &amp; cool-slate campus aesthetic designed for daytime focus.
            </p>
          </div>
        </div>

        {/* Dark Mode Option */}
        <div
          onClick={() => setTheme("dark")}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
            isDark
              ? "border-primary bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? "bg-indigo-900/60 text-indigo-300" : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">dark_mode</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Mode</p>
              {isDark && (
                <span className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20"></span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Deep navy &amp; slate-950 interface to reduce glare and eye strain in low-light environments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default: Modern Segmented Pill Button (for top header)
  return (
    <div
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTheme();
        }
      }}
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer shadow-2xs select-none transition-all hover:border-slate-300 dark:hover:border-slate-600 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark or Light Mode"
    >
      {/* Light Option */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
          !isDark
            ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-950/5"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[16px] ${
            !isDark ? "text-amber-500" : "text-slate-400"
          }`}
        >
          light_mode
        </span>
        <span className="hidden sm:inline text-[11px] tracking-tight">Light</span>
      </div>

      {/* Dark Option */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
          isDark
            ? "bg-slate-700 text-amber-300 shadow-xs ring-1 ring-white/10"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[16px] ${
            isDark ? "text-amber-300" : "text-slate-400"
          }`}
        >
          dark_mode
        </span>
        <span className="hidden sm:inline text-[11px] tracking-tight">Dark</span>
      </div>
    </div>
  );
}

export default ThemeToggle;
