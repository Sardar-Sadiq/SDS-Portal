import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* Mobile: slide-up bottom sheet. sm+: centered dialog */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="
        relative w-full sm:max-w-lg
        rounded-t-2xl sm:rounded-2xl
        bg-card border border-neutral-200 dark:border-neutral-800
        p-5 sm:p-6 shadow-2xl
        animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200
        max-h-[92dvh] sm:max-h-[85vh]
        flex flex-col overflow-hidden
      ">
        {/* Header — fixed, doesn't scroll */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800/80 mb-4 flex-shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
