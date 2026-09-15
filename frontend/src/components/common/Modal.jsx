import React from "react";

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className={`bg-surface-container-lowest border border-border-default ${maxWidth} w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl rounded-xl relative my-auto overflow-hidden animate-fadeIn`}>
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-border-default mb-4 shrink-0">
          <div>
            {title && <h3 className="font-greeting-serif text-lg sm:text-headline-md text-on-surface font-bold">{title}</h3>}
            {subtitle && <p className="text-xs text-text-stone mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-stone hover:text-primary cursor-pointer p-1 rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 pr-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}
