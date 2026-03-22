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
    if (!vehicle?.id) {
      // #region agent log
      fetch('http://127.0.0.1:7634/ingest/2a4c37c4-9528-4a94-88f0-8ea23ce2aa2e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a006d7' }, body: JSON.stringify({ sessionId: 'a006d7', hypothesisId: 'H3', location: 'VehicleLogsScreen.jsx:noVehicle', message: 'missing vehicle — clear stuck loading', data: { hasVehicle: !!vehicle }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
      // #endregion
      setLogsLoading(false);
      setLogs([]);
      return;
    }
    setLogsLoading(true);
    getLogs(vehicle.id)
      .then((l) => { setLogs(l); setLogsLoading(false); })
      .catch(() => setLogsLoading(false));
  }, [vehicle?.id]);

  const handleDelete = async (id) => {
    await deleteLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  if (!vehicle?.id) {
    return (
      <div className="flex-1 flex flex-col bg-figmaBg overflow-hidden items-center justify-center gap-4 p-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <p className="text-center text-gray-300 text-sm max-w-md">{t('vehicle.missingState')}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-accent text-sm font-medium hover:underline"
        >
          {t('comparison.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-figmaBg overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 px-5 py-4 border-b border-white/[0.08]">
        <button
          type="button"
          onClick={onBack}
          className="text-white/80 hover:text-white text-[56px] leading-none px-2 shrink-0"
          aria-label={t('landing.closePicker')}
        >
          {isRtl ? '→' : '←'}
        </button>
        {vehicle?.photo ? (
          <img src={vehicle.photo} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/20" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 shrink-0 flex items-center justify-center border border-white/20">
            <svg viewBox="0 0 48 48" className="w-10 h-10 opacity-60" fill="none">
              <ellipse cx="24" cy="24" rx="4" ry="12" fill="#b2dfdb" />
              <path d="M20 22 L4 30 L6 34 L20 27Z" fill="#80cbc4" />
              <path d="M28 22 L44 30 L42 34 L28 27Z" fill="#80cbc4" />
              <path d="M21 32 L14 38 L16 41 L22 36Z" fill="#90a4ae" />
              <path d="M27 32 L34 38 L32 41 L26 36Z" fill="#90a4ae" />
              <circle cx="24" cy="19" r="3" fill="#29b6f6" opacity="0.9" />
            </svg>
          </div>
        )}
        <h2 className="text-xl font-semibold text-white truncate">{vehicle?.name}</h2>
      </div>

      {/* Content: DropZone (left) + log list (right) — side by side, full height */}
      <div className={`flex-1 min-h-0 flex ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Left: DropZone */}
        <div className="w-[58%] flex flex-col p-6 border-e border-white/[0.08] min-h-0">
          <DropZone
            onFile={onFile}
            onFiles={onFiles}
            disabled={false}
            loading={loading}
            progress={progress}
            className="flex-1 min-h-0"
          />
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/15 text-red-300 text-sm text-center border border-red-500/30" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Right: Saved logs — scrollable list */}
        <div className="w-[42%] flex flex-col p-6 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-white/10">
            {logsLoading ? (
              <p className="px-4 py-3 text-gray-500 text-sm">{t('common.loading')}</p>
            ) : logs.length === 0 ? (
              <p className="px-4 py-3 text-gray-500 text-sm">{t('logs.empty')}</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 px-3 hover:bg-white/[0.04] transition-colors">
                    <button
                      type="button"
                      onClick={() => onLoadLog(log)}
                      disabled={loading}
                      className="flex-1 py-3 text-start disabled:opacity-50 flex flex-col gap-0.5 min-w-0"
                    >
                      <span className="text-white/90 text-sm truncate">{log.displayName}</span>
                      {log.originalName && (
                        <span className="text-xs text-white/40 truncate">{log.originalName}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
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
