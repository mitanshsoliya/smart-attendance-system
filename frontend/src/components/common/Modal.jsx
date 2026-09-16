import React from "react";

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className={`bg-surface-container-lowest border border-border-default ${maxWidth} w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-3.5 sm:p-6 shadow-2xl rounded-xl relative my-auto overflow-hidden animate-fadeIn min-w-0`}>
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-border-default mb-3 sm:mb-4 shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            {title && <h3 className="font-greeting-serif text-base sm:text-headline-md text-on-surface font-bold truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-text-stone mt-0.5 line-clamp-2">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-stone hover:text-primary cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors shrink-0 -mr-1 -mt-1"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 overscroll-contain pr-0.5 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
