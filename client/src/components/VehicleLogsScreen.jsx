import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs, deleteLog } from '../db/logsDb';
import { DropZone } from './DropZone';

export function VehicleLogsScreen({ vehicle, onFile, onFiles, loading, progress, error, onLoadLog, onBack }) {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const isRtl = i18n.language === 'he';

  useEffect(() => {
    if (!vehicle?.id) return;
    setLogsLoading(true);
    getLogs(vehicle.id)
      .then((l) => { setLogs(l); setLogsLoading(false); })
      .catch(() => setLogsLoading(false));
  }, [vehicle?.id]);

  const handleDelete = async (id) => {
    await deleteLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden aero-grid" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-border bg-surfaceContainerLow">
        <button
          type="button"
          onClick={onBack}
          className="text-muted hover:text-accent text-3xl font-label font-bold leading-none px-2 shrink-0 border border-transparent hover:border-border transition-colors"
          aria-label={t('landing.closePicker')}
        >
          {isRtl ? '→' : '←'}
        </button>
        {vehicle?.photo ? (
          <img src={vehicle.photo} alt="" className="w-14 h-14 object-cover shrink-0 border border-border" />
        ) : (
          <div className="w-14 h-14 shrink-0 flex items-center justify-center border border-border bg-surfaceRaised">
            <svg viewBox="0 0 48 48" className="w-9 h-9 opacity-70" fill="none">
              <ellipse cx="24" cy="24" rx="4" ry="12" fill="#b2dfdb" />
              <path d="M20 22 L4 30 L6 34 L20 27Z" fill="#80cbc4" />
              <path d="M28 22 L44 30 L42 34 L28 27Z" fill="#80cbc4" />
              <path d="M21 32 L14 38 L16 41 L22 36Z" fill="#90a4ae" />
              <path d="M27 32 L34 38 L32 41 L26 36Z" fill="#90a4ae" />
              <circle cx="24" cy="19" r="3" fill="#29b6f6" opacity="0.9" />
            </svg>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-label font-bold text-[10px] tracking-[0.15em] text-muted uppercase">
            {t('logs.vehicleHeader', 'פלטפורמה')}
          </p>
          <h2 className="text-xl font-headline font-bold text-onSurface truncate tracking-tight">{vehicle?.name}</h2>
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="w-[58%] flex flex-col p-6 border-e border-border min-h-0 bg-surfaceContainer/40">
          <DropZone
            onFile={onFile}
            onFiles={onFiles}
            disabled={false}
            loading={loading}
            progress={progress}
            className="flex-1 min-h-0"
          />
          {error && (
            <div className="mt-3 p-3 border border-red-300 bg-red-50 text-red-900 text-sm text-center" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="w-[42%] flex flex-col p-6 min-h-0 bg-surface">
          <p className="font-label font-bold text-[10px] tracking-[0.15em] text-muted uppercase mb-2">
            {t('logs.savedFlights', 'לוגים שמורים')}
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto border border-border bg-surfaceContainer">
            {logsLoading ? (
              <p className="px-4 py-3 text-muted text-sm">{t('common.loading')}</p>
            ) : logs.length === 0 ? (
              <p className="px-4 py-3 text-muted text-sm">{t('logs.empty')}</p>
            ) : (
              <ul className="divide-y divide-border">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 px-2 hover:bg-surfaceRaised transition-colors">
                    <button
                      type="button"
                      onClick={() => onLoadLog(log)}
                      disabled={loading}
                      className="flex-1 py-3 text-start disabled:opacity-50 flex flex-col gap-0.5 min-w-0"
                    >
                      <span className="text-onSurface text-sm font-medium truncate">{log.displayName}</span>
                      {log.originalName && (
                        <span className="text-xs text-muted truncate">{log.originalName}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center text-muted hover:text-red-700 hover:bg-red-50 transition-colors text-sm"
                      title={t('logs.delete', 'מחק לוג')}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
