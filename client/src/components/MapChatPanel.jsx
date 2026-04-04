import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function MapChatPanel({ onSend, messages = [], loading = false, onSave, embedded, showClose = true, onClose }) {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [savedIds, setSavedIds] = useState(new Set());
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    onSend(text);
  };

  const dir = i18n.language === 'he' ? 'rtl' : 'ltr';

  return (
    <div
      className={`flex flex-col min-h-0 bg-surfaceContainerLow ${embedded ? 'flex-1' : 'fixed inset-y-0 right-0 w-96 max-w-[90vw] border-l border-border shadow-xl z-50'}`}
      dir={dir}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-lg font-semibold text-accent">{t('map.unifiedChatTitle')}</h2>
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-surfaceRaised text-muted hover:text-onSurface"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-muted text-sm">{t('map.chatEmpty')}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                m.role === 'user'
                  ? 'bg-accent/20 text-accent'
                  : m.error
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-surfaceContainer border border-border text-onSurface'
              }`}
            >
              {m.text}
            </div>
            {m.role === 'assistant' && m.code && m.intent && onSave && (
              <button
                type="button"
                onClick={() => {
                  if (savedIds.has(i)) return;
                  onSave(m.code, m.intent);
                  setSavedIds((prev) => new Set([...prev, i]));
                }}
                className={`mt-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                  savedIds.has(i)
                    ? 'border-green-600 text-green-500 cursor-default'
                    : 'border-border text-muted hover:border-accent hover:text-accent cursor-pointer'
                }`}
              >
                {savedIds.has(i) ? t('map.commandSaved') : t('map.saveCommand')}
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 border bg-surfaceContainer border-border text-muted text-sm">
              {t('common.loading')}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('map.chatPlaceholder')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-surfaceContainer border border-border text-onSurface placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/35"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-accent text-white font-medium border border-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('chat.send')}
          </button>
        </div>
      </form>
    </div>
  );
}
