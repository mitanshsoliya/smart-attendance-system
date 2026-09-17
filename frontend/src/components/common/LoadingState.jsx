import React from "react";

export function LoadingSpinner({ size = "md", text = "Loading..." }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-blue-600 border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && <span className="text-xs font-medium text-slate-500 tracking-wide">{text}</span>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white border border-slate-200/80 rounded-2xl animate-pulse space-y-4 shadow-xs">
      <div className="h-4 bg-slate-100 rounded-lg w-1/3"></div>
      <div className="h-6 bg-slate-200 rounded-lg w-3/4"></div>
      <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="border border-slate-200/80 rounded-2xl bg-white p-4 animate-pulse space-y-3 shadow-xs">
      <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-50 rounded-xl w-full"></div>
      ))}
    </div>
  );
}

