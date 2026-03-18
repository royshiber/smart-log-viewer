import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChatMessage } from '../api/chat';

export function ChatPanel({ fields, messages: logMessages, selectedFields, getTimeSeries, isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const ctx = {
      availableFields: fields,
      selectedFields,
      messageTypes: [...new Set(fields.map((f) => f.split('.')[0]))],
    };
    if (selectedFields.length && getTimeSeries) {
      const samples = {};
      for (const key of selectedFields.slice(0, 3)) {
        const ts = getTimeSeries(key);
        if (ts?.y?.length) {
          const arr = ts.y;
          samples[key] = {
            min: Math.min(...arr),
            max: Math.max(...arr),
            count: arr.length,
          };
        }
      }
      ctx.sampleStats = samples;
    }
    return ctx;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = buildContext();
      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, text: m.text }));
      const { text: reply } = await sendChatMessage(allMessages, context);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply || t('chat.errorEmpty') }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `${t('common.error')}: ${err.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const dir = i18n.language === 'he' ? 'rtl' : 'ltr';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-96 max-w-[90vw] bg-surfaceRaised border-l border-border shadow-xl flex flex-col z-50"
      dir={dir}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <h2 className="text-lg font-semibold text-accent">{t('chat.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-surfaceRaised text-gray-400 hover:text-gray-200"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm">{t('chat.empty')}</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                m.role === 'user'
                  ? 'bg-accent/20 text-accent'
                  : m.error
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-surface border border-border text-gray-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg bg-surface border border-border text-gray-500 text-sm">
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
            placeholder={t('chat.placeholder')}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-accent text-surface font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('chat.send')}
          </button>
        </div>
      </form>
    </div>
  );
}
