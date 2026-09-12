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
        className={`${sizeClasses[size] || sizeClasses.md} border-secondary border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && <span className="text-xs font-mono text-text-stone tracking-wide">{text}</span>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-surface-bright border border-border-default rounded animate-pulse space-y-4">
      <div className="h-4 bg-surface-container rounded w-1/3"></div>
      <div className="h-6 bg-surface-container rounded w-3/4"></div>
      <div className="h-4 bg-surface-container rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="border border-border-default rounded bg-surface-bright p-4 animate-pulse space-y-3">
      <div className="h-6 bg-surface-container rounded w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-container-low rounded w-full"></div>
      ))}
    </div>
  );
}
