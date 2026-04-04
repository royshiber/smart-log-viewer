import { useState, useEffect, useRef } from 'react';

export function InputModal({ open, prompt, defaultValue = '', confirmLabel = 'אישור', cancelLabel = 'ביטול', onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 40);
    }
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-onSurface/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-surfaceContainer border border-border shadow-2xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <p className="text-sm text-onSurface mb-3 leading-relaxed">{prompt}</p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(value.trim()); }}
          className="w-full px-3 py-2 bg-surfaceRaised border border-border text-onSurface placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/35 mb-4 text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-muted hover:text-onSurface hover:bg-surfaceRaised border border-transparent hover:border-border transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value.trim())}
            className="px-4 py-1.5 text-sm bg-accent text-white font-medium hover:bg-accent/90 transition-colors border border-accent"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
