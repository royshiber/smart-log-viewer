import { useMemo } from 'react';

/** ArduPilot GPS coords are often degE7 */
function toDegrees(val) {
  if (val == null) return null;
  if (Math.abs(val) > 1e6) return val / 1e7;
  return val;
}

/** Get value at time t by interpolating between nearest samples */
function valueAtTime(ts, t) {
  if (!ts?.x?.length || !ts?.y?.length) return null;
  const x = ts.x;
  const y = ts.y;
  if (t <= x[0]) return y[0];
  if (t >= x[x.length - 1]) return y[y.length - 1];
  for (let i = 0; i < x.length - 1; i++) {
    if (x[i] <= t && t <= x[i + 1]) {
      const frac = (t - x[i]) / (x[i + 1] - x[i] || 1);
      return y[i] + frac * (y[i + 1] - y[i]);
    }
  }
  return null;
}

export function usePathWithField(fields, getTimeSeries, fieldKey) {
  return useMemo(() => {
    if (!fields?.length || !getTimeSeries || !fieldKey) return null;
    const latKey = fields.find((f) => f.endsWith('.Lat'));
    const lngKey = fields.find((f) => f.endsWith('.Lng'));
    if (!latKey || !lngKey) return null;
    const latTs = getTimeSeries(latKey);
    const lngTs = getTimeSeries(lngKey);
    const valTs = getTimeSeries(fieldKey);
    if (!latTs?.y?.length || !lngTs?.y?.length || !valTs) return null;
    const times = latTs.x ?? Array.from({ length: latTs.y.length }, (_, i) => i);
    const len = Math.min(latTs.y.length, lngTs.y.length, times.length);
    const path = [];
    const values = [];
    for (let i = 0; i < len; i++) {
      const lat = toDegrees(latTs.y[i]);
      const lng = toDegrees(lngTs.y[i]);
      const t = times[i];
      const v = valueAtTime(valTs, t);
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        path.push([lat, lng]);
        values.push(v);
      }
    }
    return path.length ? { path, values } : null;
  }, [fields, getTimeSeries, fieldKey]);
}
