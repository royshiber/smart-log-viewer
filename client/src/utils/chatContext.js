/**
 * Build rich context for Gemini chat - all fields, stats, labels, aliases
 */
import { FIELD_LABELS_HE } from './fieldLabels.js';
import { buildTimeToWallClock } from './csvGpsTime.js';

const CONCEPT_ALIASES = {
  גובה: ['Alt', 'RelAlt', 'BarAlt'],
  גלגול: ['Roll', 'NavRoll', 'DesRoll'],
  עלרוד: ['Pitch', 'NavPitch', 'DesPitch'],
  סיבוב: ['Yaw', 'DesYaw', 'NavYaw'],
  מהירות: ['Spd', 'GSpd', 'Aspd', 'VSpd'],
  מצערת: ['Thr', 'ThrOut', 'ThO'],
  לוויינים: ['NSats'],
  לווינים: ['NSats'],
  altitude: ['Alt', 'RelAlt', 'BarAlt'],
  roll: ['Roll', 'NavRoll'],
  pitch: ['Pitch', 'NavPitch'],
  speed: ['Spd', 'GSpd', 'Aspd'],
  throttle: ['Thr', 'ThrOut'],
  satellites: ['NSats'],
};

function downsample(arr, maxPoints = 120) {
  if (!arr?.length || arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const out = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.floor(i * step);
    out.push(arr[idx]);
  }
  return out;
}

export function buildChatContext(fields, selectedFields, getTimeSeries, messages) {
  const ctx = {
    availableFields: fields,
    selectedFields,
    messageTypes: [...new Set((fields || []).map((f) => f.split('.')[0]))],
    fieldLabels: {},
    conceptToFields: {},
    allStats: {},
    downsampled: {},
    absoluteTimeHints: {},
  };

  if (!fields?.length) return ctx;

  for (const f of fields) {
    const fn = f.includes('.') ? f.split('.')[1] : f;
    if (FIELD_LABELS_HE[fn]) ctx.fieldLabels[f] = FIELD_LABELS_HE[fn];
  }

  for (const [concept, fieldNames] of Object.entries(CONCEPT_ALIASES)) {
    const matching = fields.filter((k) => {
      const fn = k.includes('.') ? k.split('.')[1] : k;
      return fieldNames.includes(fn);
    });
    if (matching.length) ctx.conceptToFields[concept] = matching;
  }

  if (!getTimeSeries) return ctx;
  const toWallClock = messages ? buildTimeToWallClock(messages) : null;

  const fn = (f) => (f.includes('.') ? f.split('.')[1] : f);
  const priority = fields.filter((f) => ['Alt', 'Roll', 'Pitch', 'Spd', 'Yaw', 'NSats', 'Thr', 'GSpd'].some((n) => fn(f).includes(n)));
  const toProcess = [...new Set([...selectedFields, ...priority, ...fields])];
  for (const key of toProcess.slice(0, 50)) {
    const ts = getTimeSeries(key);
    if (ts?.y?.length) {
      const arr = ts.y;
      const sum = arr.reduce((a, b) => a + b, 0);
      ctx.allStats[key] = {
        min: Math.min(...arr),
        max: Math.max(...arr),
        avg: sum / arr.length,
        count: arr.length,
      };
      if (selectedFields.includes(key) && arr.length > 10) {
        ctx.downsampled[key] = {
          x: downsample(ts.x),
          y: downsample(arr),
        };
        if (toWallClock) {
          const sampleX = downsample(ts.x, 24);
          const mapped = sampleX
            .map((x) => ({ logTime: x, wallClock: toWallClock(x)?.israelLocal || null }))
            .filter((r) => r.wallClock);
          if (mapped.length) ctx.absoluteTimeHints[key] = mapped;
        }
      }
    }
  }

  return ctx;
}
