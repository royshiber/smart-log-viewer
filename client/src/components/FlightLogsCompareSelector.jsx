import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs, getLog } from '../db/logsDb';

const MAX_EXTRA = 4;

/** Stacked-lines icon — “several flights on one chart” */
function FlightsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 17c2-3 4-4 7-4s5 1 7 4" strokeLinecap="round" />
      <path d="M3 12c2-2.5 4-3.5 7-3.5s5 1 7 3.5" strokeLinecap="round" opacity="0.85" />
      <path d="M3 7c2-2 4-3 7-3s5 1 7 3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/**
 * Add saved logs from the *current* vehicle as extra series on the chart (same fields as main log).
 * Distinct from ComparisonSelector: that one picks another *vehicle* first; this one is for comparing
 * multiple *flights* (saved BINs) — typically same airframe, different days.
 */
export function FlightLogsCompareSelector({
  vehicleId,
  vehicleName,
  /** Log id of the trace currently shown as main chart (from DB) — cannot add as overlay */
  primaryLogId = null,
  comparisons,
  onAdd,
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const isRtl = i18n.language === 'he';

  const activeIds = new Set(comparisons.map((c) => c.id));
  const atLimit = comparisons.length >= MAX_EXTRA;

  useEffect(() => {
    if (!open || !vehicleId) return;
    setLoading(true);
    getLogs(vehicleId)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [open, vehicleId]);

  const handlePick = async (log) => {
    if (activeIds.has(log.id) || atLimit) return;
    setOpen(false);
    const full = await getLog(log.id);
    if (full?.rawBin) {
      onAdd(log.id, vehicleName || t('vehicle.newVehicle', 'כטב"ם חדש'), log.displayName || log.originalName || log.id, full.rawBin, vehicleId);
    }
  };

  const btnClass =
    'flex items-center justify-center gap-2 w-full min-h-[52px] px-3 py-2 border bg-surfaceContainer border-border text-sm text-onSurface hover:border-accent hover:text-accent transition-all';

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!vehicleId}
        className={`${btnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
        title={t('comparison.flightLogsHint')}
      >
        <FlightsIcon className="w-6 h-6 shrink-0 text-accent/90" />
        <span className="truncate text-center leading-tight">{t('comparison.addFlightLogs')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-onSurface/35 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md max-h-[min(80vh,520px)] bg-surfaceContainer border border-border shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-accent">{t('comparison.addFlightLogs')}</h3>
                <p className="text-xs text-muted mt-0.5">{t('comparison.flightLogsSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-onSurface px-2 py-1 border border-transparent hover:border-border text-lg leading-none shrink-0"
                aria-label={t('landing.closePicker')}
              >
                ✕
              </button>
            </div>

            {atLimit && (
              <p className="px-4 py-2 text-xs text-amber-900 bg-amber-50 border-b border-amber-200">
                {t('comparison.maxComparisons', { count: MAX_EXTRA })}
              </p>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-muted text-sm text-center">{t('common.loading')}</p>
              ) : logs.length === 0 ? (
                <p className="px-4 py-6 text-muted text-sm text-center">{t('comparison.noSavedLogsForVehicle')}</p>
              ) : (
                <ul className="py-2">
                  {logs.map((log) => {
                    const added = activeIds.has(log.id);
                    const isMain = primaryLogId != null && log.id === primaryLogId;
                    const disabled = added || atLimit || isMain;
                    return (
                      <li key={log.id}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handlePick(log)}
                          className={`w-full px-4 py-3 text-sm text-start border-b border-border transition-colors ${
                            added || isMain
                              ? 'text-muted cursor-default'
                              : atLimit
                                ? 'text-muted cursor-not-allowed'
                                : 'text-onSurface hover:bg-surfaceRaised'
                          }`}
                        >
                          <span className="font-medium block truncate">{log.displayName}</span>
                          {log.originalName && (
                            <span className="text-xs text-muted truncate block">{log.originalName}</span>
                          )}
                          {isMain && (
                            <span className="text-xs text-accent/80 mt-0.5">{t('comparison.isMainChartLog')}</span>
                          )}
                          {added && !isMain && (
                            <span className="text-xs text-accent/80 mt-0.5">{t('comparison.alreadyOnChart')}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
