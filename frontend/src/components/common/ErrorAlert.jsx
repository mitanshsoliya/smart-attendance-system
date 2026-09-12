import React from "react";

export function ErrorAlert({ message, onClose, onRetry }) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded flex items-center justify-between gap-4 text-sm text-primary">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-error text-[20px]">error</span>
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-2.5 py-1 bg-error text-white text-xs font-semibold rounded hover:opacity-90 cursor-pointer"
          >
            Retry
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-muted hover:text-primary cursor-pointer"
            title="Dismiss error alert"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
