import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function RequestBar({ onRequest, disabled, loading, placeholder }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const ph = placeholder ?? t('graphRequest.placeholder');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled || loading) return;
    onRequest(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 bg-surfaceContainerLow border-t border-border">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ph}
        disabled={disabled || loading}
        className="flex-1 px-4 py-2 bg-surfaceContainer border border-border text-onSurface placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/35 disabled:opacity-70 text-sm"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled || loading}
        className="px-4 py-2 bg-accent text-white font-label font-bold text-xs uppercase tracking-wider hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[4.5rem] justify-center border border-accent"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('graphRequest.searching')}
          </>
        ) : (
          t('graphRequest.apply')
        )}
      </button>
    </form>
  );
}
