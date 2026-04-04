import { useMemo, useState } from 'react';

const CONFIG_TEXT = `# ArduPilot Vision Landing config (baseline)
SERIAL2_PROTOCOL,2
SERIAL2_BAUD,921
SR2_EXT_STAT,5
SR2_EXTRA1,10
SR2_EXTRA2,10
SR2_EXTRA3,5
SR2_POSITION,10
SR2_RAW_SENS,5
SR2_RC_CHAN,5
LOG_DISARMED,1
LOG_REPLAY,1
LOG_BACKEND_TYPE,1
EK3_ENABLE,1
AHRS_EKF_TYPE,3
GPS_AUTO_SWITCH,1
FS_GCS_ENABLE,1
FS_OPTIONS,0
PLND_ENABLED,0
PLND_TYPE,1
PLND_ORIENT,0
PLND_YAW_ALIGN,0`;

export function ArduPilotConfigPanel({ isRtl }) {
  const [copyState, setCopyState] = useState('idle');
  const linesCount = useMemo(() => CONFIG_TEXT.split('\n').length, []);

  const handleCopy = async () => {
    // Why: operators need fast transfer into Mission Planner without manual retyping.
    // What: copies the curated baseline parameter pack to clipboard.
    try {
      await navigator.clipboard.writeText(CONFIG_TEXT);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1200);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 1200);
    }
  };

  return (
    <div className="h-full overflow-auto px-4 py-3 text-onSurface">
      <div className="rounded-xl border border-border bg-surfaceRaised p-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-accent">
            {isRtl ? 'ArduPilot Config לטעינה' : 'ArduPilot Config Pack'}
          </h2>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs px-3 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
          >
            {copyState === 'copied'
              ? (isRtl ? 'הועתק' : 'Copied')
              : copyState === 'failed'
                ? (isRtl ? 'שגיאת העתקה' : 'Copy failed')
                : (isRtl ? 'העתק קונפיג' : 'Copy config')}
          </button>
        </div>
        <p className="text-xs text-muted mt-1">
          {isRtl
            ? `חבילת התחלה של ${linesCount} שורות לפרמטרים ייעודיים. קודם Bench/SITL ואז שטח.`
            : `Starter pack of ${linesCount} dedicated parameter lines. Bench/SITL first, then field tests.`}
        </p>
      </div>

      <pre className="rounded-xl border border-border bg-black/30 p-4 text-xs leading-6 whitespace-pre-wrap">
        {CONFIG_TEXT}
      </pre>
    </div>
  );
}
