import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs, updateLog, deleteLog } from '../db/logsDb';

export function LogList({
  vehicleId,
  onLoad,
  disabled,
  refreshKey,
  onPrompt,
  onLogDeleted,
  visibleLogIds = [],
  onToggleVisibility,
  mainLogId = null,
  extraVehicleIds = [],
  vehicleNamesById = {},
}) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vehicleId) {
      setLogs([]);
      return;
    }
    setLoading(true);
    const ids = [vehicleId, ...extraVehicleIds.filter((id) => id && id !== vehicleId)];
    Promise.all(ids.map((id) => getLogs(id).then((items) => ({ id, items })).catch(() => ({ id, items: [] }))))
      .then((sections) => {
        const combined = [];
        sections.forEach((s) => {
          const title = vehicleNamesById[s.id] || s.id;
          (s.items || []).forEach((log) => combined.push({ ...log, __vehicleId: s.id, __vehicleTitle: title }));
        });
        setLogs(combined);
      })
      .finally(() => setLoading(false));
  }, [vehicleId, refreshKey, JSON.stringify(extraVehicleIds), JSON.stringify(vehicleNamesById)]);

  const handleRename = async (log) => {
    const newName = onPrompt
      ? await onPrompt(t('logs.renamePrompt', 'שם חדש ללוג:'), log.displayName)
      : window.prompt(t('logs.renamePrompt', 'שם חדש ללוג:'), log.displayName);
    if (newName == null || !newName.trim()) return;
    const updated = await updateLog(log.id, { displayName: newName.trim() });
    setLogs((prev) => prev.map((l) => (l.id === log.id ? { ...l, displayName: updated.displayName } : l)));
  };

  const handleDelete = async (e, log) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t('logs.deleteConfirm'))) return;
    await deleteLog(log.id);
    setLogs((prev) => prev.filter((l) => l.id !== log.id));
    onLogDeleted?.(log.id);
  };

  if (!vehicleId) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-2 text-xs font-medium text-accent/90 uppercase tracking-wider border-b border-border shrink-0">
        {t('logs.title')}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2" style={{ minHeight: '100px' }}>
        {loading ? (
          <p className="text-gray-500 text-sm">{t('common.loading')}</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('logs.empty')}</p>
        ) : (
          <ul className="space-y-0.5">
            {logs.map((log, idx) => (
              <li key={log.id} className="min-w-0">
                {(idx === 0 || logs[idx - 1].__vehicleId !== log.__vehicleId) && (
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-accent/80">
                    {log.__vehicleTitle}
                  </div>
                )}
                <div className="flex items-center gap-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onLoad(log)}
                  onContextMenu={(e) => { e.preventDefault(); handleRename(log); }}
                  disabled={disabled}
                  className="flex-1 min-w-0 text-start px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-surface hover:text-gray-100 truncate disabled:opacity-50"
                  title={`${log.displayName}\n${t('logs.rename', 'שנה שם')} (לחץ ימין)`}
                >
                  {log.displayName}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisibility?.(log);
                  }}
                  className={`shrink-0 w-6 h-6 flex items-center justify-center rounded border border-border text-xs leading-none ${
                    mainLogId === log.id || visibleLogIds.includes(log.id)
                      ? 'text-accent border-accent/50'
                      : 'text-gray-500 hover:text-accent'
                  }`}
                  title={mainLogId === log.id ? (t('logs.mainVisible', 'לוג ראשי מוצג')) : (visibleLogIds.includes(log.id) ? t('logs.hideData', 'הסתר נתוני לוג') : t('logs.showData', 'הצג נתוני לוג'))}
                  aria-label={visibleLogIds.includes(log.id) ? t('logs.hideData', 'הסתר נתוני לוג') : t('logs.showData', 'הצג נתוני לוג')}
                >
                  {mainLogId === log.id || visibleLogIds.includes(log.id) ? '👁' : '◯'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, log)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded border border-border text-gray-500 hover:text-red-400 hover:border-red-500/50 text-xs leading-none"
                  title={t('logs.delete', 'מחק לוג')}
                  aria-label={t('logs.delete', 'מחק לוג')}
                >
                  ✕
                </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
