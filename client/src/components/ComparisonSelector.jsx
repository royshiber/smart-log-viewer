import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs, getLog } from '../db/logsDb';

const COMP_COLORS = ['#f85149', '#d29922', '#a371f7', '#ff7b72'];

function CompareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8h6M4 16h6M14 8h6M14 16h6" strokeLinecap="round" />
      <path d="M10 8v8M10 12h4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Button + modal for adding/removing comparison vehicles on the chart.
 */
export function ComparisonSelector({ vehicles, selectedVehicleId, comparisons, onAdd, onRemove }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('vehicles');
  const [pickedVehicle, setPickedVehicle] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const panelRef = useRef(null);

  const otherVehicles = vehicles.filter((v) => v.id !== selectedVehicleId);
  const isRtl = i18n.language === 'he';

  useEffect(() => {
    if (!open) {
      setStep('vehicles');
      setPickedVehicle(null);
      setLogs([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleVehiclePick = async (vehicle) => {
    setPickedVehicle(vehicle);
    setStep('logs');
    setLogsLoading(true);
    const l = await getLogs(vehicle.id);
    setLogs(l);
    setLogsLoading(false);
  };

  const handleLogPick = async (log) => {
    setOpen(false);
    const fullLog = await getLog(log.id);
    if (fullLog?.rawBin) {
      onAdd(log.id, pickedVehicle.name, log.displayName, fullLog.rawBin, pickedVehicle.id);
    }
  };

  const btnClass =
    'flex items-center justify-center gap-2 w-full min-h-[52px] px-3 py-2 rounded-xl bg-surfaceRaised border border-border text-sm text-gray-200 hover:border-accent/50 hover:text-accent transition-all shadow-sm';

  return (
    <div className="relative w-full" ref={panelRef}>
      <button type="button" onClick={() => setOpen(true)} className={btnClass} title={t('comparison.addVehicle')}>
        <CompareIcon className="w-6 h-6 shrink-0 text-accent/90" />
        <span className="truncate text-center leading-tight">{t('comparison.addVehicle')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/65"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md max-h-[min(80vh,520px)] rounded-xl bg-surfaceRaised border border-border shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
              <h3 className="text-sm font-semibold text-accent">
                {step === 'vehicles' ? t('comparison.addVehicle') : t('comparison.selectLog', 'בחר לוג')}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-100 px-2 py-1 rounded-lg hover:bg-surface text-lg leading-none"
                aria-label={t('landing.closePicker')}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {step === 'vehicles' ? (
                <>
                  {otherVehicles.length === 0 ? (
                    <p className="px-4 py-6 text-gray-500 text-sm text-center">{t('vehicle.noVehicles')}</p>
                  ) : (
                    <ul className="py-2">
                      {otherVehicles.map((v) => (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => handleVehiclePick(v)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-surface transition-colors text-start"
                          >
                            {v.photo ? (
                              <img src={v.photo} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-sm border border-border">✈</div>
                            )}
                            <span className="truncate font-medium">{v.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-border flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStep('vehicles')}
                      className="text-accent hover:text-accent/80 text-sm font-medium"
                    >
                      ← {t('comparison.back')}
                    </button>
                    <span className="text-xs text-gray-500 truncate">{pickedVehicle?.name}</span>
                  </div>
                  {logsLoading ? (
                    <p className="px-4 py-6 text-gray-500 text-sm text-center">{t('common.loading')}</p>
                  ) : logs.length === 0 ? (
                    <p className="px-4 py-6 text-gray-500 text-sm text-center">{t('comparison.noLogs')}</p>
                  ) : (
                    <ul className="py-2">
                      {logs.map((log) => (
                        <li key={log.id}>
                          <button
                            type="button"
                            onClick={() => handleLogPick(log)}
                            className="w-full px-4 py-3 text-sm text-gray-200 hover:bg-surface transition-colors text-start truncate border-b border-border/40"
                          >
                            {log.displayName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-1.5 flex flex-col gap-1.5">
        {comparisons.map((comp, i) => (
          <div
            key={comp.id}
            className="flex items-center gap-2 w-full min-h-[52px] px-3 py-2 rounded-xl border shadow-sm shrink-0"
            style={{ borderColor: `${COMP_COLORS[i % COMP_COLORS.length]}80`, background: `${COMP_COLORS[i % COMP_COLORS.length]}14` }}
          >
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-border/50">
              <div className="w-3 h-3 rounded-full" style={{ background: COMP_COLORS[i % COMP_COLORS.length] }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-gray-100 truncate text-center leading-tight">{comp.vehicleName}</div>
              <div className="text-xs text-gray-400 truncate text-center leading-tight">{comp.logName}</div>
            </div>
            {comp.loading && <span className="text-gray-500">{t('common.loading')}</span>}
            <button
              type="button"
              onClick={() => onRemove(comp.id)}
              className="text-gray-400 hover:text-red-400 shrink-0 leading-none ms-auto"
              title={t('comparison.remove')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
