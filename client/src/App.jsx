import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DropZone } from './components/DropZone';
import { FieldsSidebar } from './components/FieldsSidebar';
import { ChartPanel } from './components/ChartPanel';
import { RequestBar } from './components/RequestBar';
import { ChatPanel } from './components/ChatPanel';
import { useBinParser } from './hooks/useBinParser';
import { parseGraphRequest } from './utils/parseGraphRequest';
import { getFieldLabel } from './utils/fieldLabels';

const COLORS = ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7', '#79c0ff', '#ff7b72', '#56d364'];

export default function App() {
  const { t, i18n } = useTranslation();
  const { fields, messages, progress, parseFile, loading, error, getTimeSeries } = useBinParser();
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldColors, setFieldColors] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [fieldFeedback, setFieldFeedback] = useState(null);

  const hasData = fields.length > 0;

  const series = useMemo(() => {
    if (!selectedFields.length) return [];
    return selectedFields.map((key, i) => {
      const ts = getTimeSeries(key);
      if (!ts) return null;
      const color = fieldColors[key] || COLORS[i % COLORS.length];
      return { ...ts, color };
    }).filter(Boolean);
  }, [selectedFields, getTimeSeries, fieldColors]);


  const handleGraphRequest = useCallback((text) => {
    if (fields.length === 0) return;
    setFieldFeedback(null);
    const { fields: parsedFields, append, notFound, suggested } = parseGraphRequest(text, fields);
    if (parsedFields.length) {
      const names = parsedFields.map((p) => p.name);
      const newColors = Object.fromEntries(parsedFields.map((p) => [p.name, p.color]));
      setSelectedFields((prev) => (append ? [...prev, ...names.filter((n) => !prev.includes(n))] : names));
      setFieldColors((prev) => (append ? { ...prev, ...newColors } : newColors));
    } else if (notFound) {
      setFieldFeedback({ suggested: suggested || [] });
    }
  }, [fields]);

  return (
    <div
      className="min-h-screen bg-surface text-gray-200"
      dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
    >
      <header className="h-12 flex items-center justify-between px-4 bg-surfaceRaised border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-accent">{t('appTitle')}</h1>
          {hasData && (
            <label className="text-sm px-3 py-1 rounded bg-surface border border-border cursor-pointer hover:border-accent/50 text-gray-300">
              {t('dropZone.newFile')}
              <input
                type="file"
                accept=".bin,.BIN"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const r = new FileReader();
                    r.onload = () => parseFile(r.result);
                    r.readAsArrayBuffer(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {hasData && (
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className={`px-3 py-1 rounded text-sm ${chatOpen ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t('chat.title')}
            </button>
          )}
          <button
            type="button"
            onClick={() => i18n.changeLanguage('he')}
            className={`px-2 py-1 rounded text-sm ${i18n.language === 'he' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300'}`}
          >
            עברית
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage('en')}
            className={`px-2 py-1 rounded text-sm ${i18n.language === 'en' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300'}`}
          >
            English
          </button>
        </div>
      </header>

      <main className="flex flex-col h-[calc(100vh-3rem)]">
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-xl">
              <DropZone
                onFile={parseFile}
                disabled={false}
                loading={loading}
                progress={progress}
              />
              {error && (
                <div className="mt-4 p-3 rounded bg-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex min-h-0">
              <aside className="w-64 shrink-0">
                <FieldsSidebar
                  fields={fields}
                  selected={selectedFields}
                  onChange={setSelectedFields}
                />
              </aside>
              <div className="flex-1 flex flex-col min-w-0 p-4">
                <ChartPanel series={series} />
              </div>
            </div>
            {fieldFeedback && (
              <div className="px-4 py-2 bg-amber-500/20 border-t border-amber-500/30 text-amber-200 text-sm flex items-start justify-between gap-2">
                <div>
                <p>{t('fieldNotFound.message')}</p>
                {fieldFeedback.suggested.length > 0 && (
                <p className="mt-1 text-amber-300/90">
                  {t('fieldNotFound.suggest')}{' '}
                  {fieldFeedback.suggested.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setSelectedFields((prev) => [...prev.filter((x) => x !== f), f]);
                        setFieldColors((prev) => ({ ...prev, [f]: prev[f] ?? COLORS[Object.keys(prev).length % COLORS.length] }));
                        setFieldFeedback(null);
                      }}
                      className="underline hover:no-underline mr-2"
                    >
                      {getFieldLabel(f, i18n.language)}
                    </button>
                  ))}
                </p>
                )}
                </div>
                <button type="button" onClick={() => setFieldFeedback(null)} className="text-amber-400 hover:text-amber-200 shrink-0">✕</button>
              </div>
            )}
            <RequestBar
              onRequest={handleGraphRequest}
              disabled={!hasData}
            />
          </>
        )}
      </main>
      {hasData && (
        <ChatPanel
          fields={fields}
          messages={messages}
          selectedFields={selectedFields}
          getTimeSeries={getTimeSeries}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
