import React, { useEffect } from "react";

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className={`relative bg-white border border-slate-200/90 ${maxWidth} w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl rounded-2xl my-auto overflow-hidden animate-fadeIn z-10 min-w-0`}>
        <div className="flex justify-between items-start pb-3 sm:pb-4 border-b border-slate-100 mb-3 sm:mb-4 shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base sm:text-lg text-slate-900 font-bold tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0 -mr-1 -mt-1"
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

