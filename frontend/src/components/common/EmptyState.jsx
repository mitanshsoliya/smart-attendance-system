import React from "react";

export function EmptyState({ icon = "inbox", title = "No Records Found", description = "There are no items to display at this time.", actionLabel, onAction }) {
  return (
    <div className="p-8 sm:p-12 bg-white border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center gap-3 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-1">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

