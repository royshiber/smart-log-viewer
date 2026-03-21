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
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60"
      onClick={onCancel}
    >
      <div
        className="bg-surfaceRaised border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <p className="text-sm text-gray-200 mb-3 leading-relaxed">{prompt}</p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(value.trim()); }}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 mb-4 text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-surface transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value.trim())}
            className="px-4 py-1.5 rounded-lg text-sm bg-accent text-surface font-medium hover:bg-accent/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
