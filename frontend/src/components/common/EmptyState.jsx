import React from "react";

export function EmptyState({ icon = "inbox", title = "No Records Found", description = "There are no items to display at this time.", actionLabel, onAction }) {
  return (
    <div className="p-8 bg-surface-bright border border-border-default rounded flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-text-stone">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <h4 className="font-headline-md text-lg font-bold text-primary">{title}</h4>
      <p className="font-body-md text-sm text-text-stone max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-secondary text-on-secondary font-label-md text-xs font-semibold rounded hover:opacity-90 transition-opacity cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
