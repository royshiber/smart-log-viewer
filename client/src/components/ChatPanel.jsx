import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { streamChatMessage, getGeminiStatus } from '../api/chat';
import { buildChatContext } from '../utils/chatContext';

/**
 * Unified Gemini chat panel — always visible on the right side.
 * Handles both Q&A (all tabs) and map commands (when activeTab === 'map').
 *
 * Props:
 *   fields, logMessages, selectedFields, getTimeSeries  — for Q&A context
 *   activeTab     — 'chart' | 'map'
 *   messages      — controlled message list from parent
 *   onMessages    — setter for message list (parent owns state for persistence)
 *   onMapCommand  — called with (code) when Gemini returns JS map code
 *   onSaveCommand — called with (code, intent) to save a map command
 *   widthPx / onWidthPxChange — resizable width
 */
export function ChatPanel({
  fields,
  logMessages,
  selectedFields,
  getTimeSeries,
  activeTab = 'chart',
  messages,
  onMessages,
  onMapCommand,
  onSaveCommand,
  widthPx = 360,
  onWidthPxChange,
  widthMinPx = 260,
  widthMaxPx = 760,
}) {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState({ ok: null, reason: i18n.language === 'he' ? 'בודק חיבור...' : 'Checking...' });
  const scrollRef = useRef(null);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let live = true;
    const poll = async () => {
      try {
        const s = await getGeminiStatus();
        if (!live) return;
        setGeminiStatus({
          ok: !!s.ok,
          reason: s.reason || (s.ok ? (i18n.language === 'he' ? 'חיבור תקין' : 'Connected') : (i18n.language === 'he' ? 'לא תקין' : 'Unavailable')),
        });
      } catch (e) {
        if (!live) return;
        setGeminiStatus((prev) => {
          if (prev.ok === true) return prev; // avoid false red when status check transiently fails
          return { ok: null, reason: i18n.language === 'he' ? 'בדיקת סטטוס זמנית נכשלה' : 'Status check temporarily failed' };
        });
      }
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => { live = false; clearInterval(id); };
  }, [i18n.language]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', text };
    const next = [...(messages || []), userMsg];
    onMessages(next);
    setLoading(true);

    if (activeTab === 'map') {
      // Map mode: use unified chat (returns text + optional code)
      const streamingId = Date.now();
      onMessages([...next, { role: 'assistant', text: '', id: streamingId, streaming: true }]);
      try {
        const { sendUnifiedChatMessage } = await import('../api/chat');
        const context = buildChatContext(fields, selectedFields, getTimeSeries, logMessages);
        const allMsgs = next.map((m) => ({ role: m.role, text: m.text }));
        const { text: reply, code, intent } = await sendUnifiedChatMessage(
          allMsgs, context, null, null, fields, null, null
        );
        onMessages((prev) => prev.map((m) =>
          m.id === streamingId
            ? { ...m, text: reply || t('chat.errorEmpty'), code: code || null, intent: intent || null, streaming: false }
            : m
        ));
        if (code) onMapCommand?.(code);
      } catch (err) {
        onMessages((prev) => prev.map((m) =>
          m.id === streamingId
            ? { ...m, text: t('apiError.geminiUnavailable'), error: true, streaming: false }
            : m
        ));
      } finally {
        setLoading(false);
      }
    } else {
      // Chart / Q&A mode: use streaming chat
      const streamingId = Date.now();
      onMessages([...next, { role: 'assistant', text: '', id: streamingId, streaming: true }]);
      try {
        const context = buildChatContext(fields, selectedFields, getTimeSeries, logMessages);
        const allMsgs = next.map((m) => ({ role: m.role, text: m.text }));
        await streamChatMessage(allMsgs, context, (delta) => {
          onMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, text: m.text + delta } : m)
          );
        });
        setGeminiStatus({
          ok: true,
          reason: i18n.language === 'he' ? 'חיבור תקין' : 'Connected',
        });
        onMessages((prev) =>
          prev.map((m) => m.id === streamingId ? { ...m, streaming: false } : m)
        );
      } catch (err) {
        onMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, text: `${t('common.error')}: ${err.message}`, error: true, streaming: false }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const dir = i18n.language === 'he' ? 'rtl' : 'ltr';

  return (
    <div
      className="flex flex-col h-full bg-surfaceRaised border-l border-border"
      dir={dir}
      style={{ width: widthPx, minWidth: widthMinPx, maxWidth: widthMaxPx, flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-semibold text-accent shrink-0">{t('chat.title')}</h2>
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              geminiStatus.ok == null ? 'bg-amber-400' : geminiStatus.ok ? 'bg-emerald-400' : 'bg-red-500'
            }`}
            title={geminiStatus.ok
              ? (i18n.language === 'he' ? `חיבור תקין: ${geminiStatus.reason}` : `Connected: ${geminiStatus.reason}`)
              : (i18n.language === 'he' ? `לא תקין: ${geminiStatus.reason}` : `Unavailable: ${geminiStatus.reason}`)}
            aria-label={geminiStatus.reason}
          />
          {activeTab === 'map' && (
            <span className="text-xs text-gray-500 bg-surface/60 px-2 py-0.5 rounded-full border border-border shrink-0">
              {t('map.mapMode', 'מצב מפה')}
            </span>
          )}
        </div>
        {typeof onWidthPxChange === 'function' && (
          <input
            type="range"
            min={widthMinPx}
            max={Math.max(widthMinPx, widthMaxPx)}
            step={10}
            value={widthPx}
            onChange={(e) => onWidthPxChange(Number(e.target.value))}
            className="w-20 accent-accent mx-2"
            aria-label="Chat width"
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {(!messages || messages.length === 0) && (
          <p className="text-gray-500 text-xs">
            {activeTab === 'map' ? t('map.chatEmpty') : t('chat.empty')}
          </p>
        )}
        {(messages || []).map((m, i) => (
          <div key={m.id || i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[90%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-accent/20 text-accent'
                  : m.error
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-surface border border-border text-gray-200'
              } ${m.streaming ? 'opacity-80' : ''}`}
            >
              {m.text}
              {m.streaming && <span className="inline-block w-1.5 h-3 bg-accent/60 ml-1 animate-pulse rounded-sm" />}
            </div>
            {/* Save map command button */}
            {m.role === 'assistant' && m.code && m.intent && onSaveCommand && (
              <button
                type="button"
                onClick={() => {
                  if (savedIds.has(i)) return;
                  onSaveCommand(m.code, m.intent);
                  setSavedIds((prev) => new Set([...prev, i]));
                }}
                className={`mt-1 text-xs px-2 py-0.5 rounded border transition-colors ${
                  savedIds.has(i)
                    ? 'border-green-600 text-green-500 cursor-default'
                    : 'border-border text-gray-500 hover:border-accent hover:text-accent cursor-pointer'
                }`}
              >
                {savedIds.has(i) ? t('map.commandSaved') : t('map.saveCommand')}
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg bg-surface border border-border text-gray-500 text-xs">
              {t('common.loading')}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeTab === 'map' ? t('map.chatPlaceholder') : t('chat.placeholder')}
            disabled={loading}
            className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 py-1.5 bg-accent text-surface font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {t('chat.send')}
          </button>
        </div>
      </form>
    </div>
  );
}
