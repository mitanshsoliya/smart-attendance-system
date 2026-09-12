import React from "react";

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`bg-surface-container-lowest border border-border-default ${maxWidth} w-full p-6 shadow-2xl rounded relative my-8`}>
        <div className="flex justify-between items-start pb-4 border-b border-border-default mb-4">
          <div>
            {title && <h3 className="font-greeting-serif text-headline-md text-on-surface font-bold">{title}</h3>}
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
        {children}
      </div>
    </div>
  );
}
