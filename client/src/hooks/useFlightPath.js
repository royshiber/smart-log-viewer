import { useMemo } from 'react';

/** ArduPilot GPS coords are often degE7 (degrees * 1e7) */
function toDegrees(val) {
  if (val == null) return null;
  if (Math.abs(val) > 1e6) return val / 1e7;
  return val;
}

export function useFlightPath(fields, getTimeSeries) {
  return useMemo(() => {
    if (!fields?.length || !getTimeSeries) return null;
    const latKey = fields.find((f) => f.endsWith('.Lat'));
    const lngKey = fields.find((f) => f.endsWith('.Lng'));
    if (!latKey || !lngKey) return null;
    const latTs = getTimeSeries(latKey);
    const lngTs = getTimeSeries(lngKey);
    if (!latTs?.y?.length || !lngTs?.y?.length) return null;
    const times = latTs.x ?? Array.from({ length: latTs.y.length }, (_, i) => i);
    const len = Math.min(latTs.y.length, lngTs.y.length, times.length);
    const path = [];
    const pathTimes = [];
    for (let i = 0; i < len; i++) {
      const lat = toDegrees(latTs.y[i]);
      const lng = toDegrees(lngTs.y[i]);
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        path.push([lat, lng]);
        pathTimes.push(times[i]);
      }
    }
    return path.length ? { path, times: pathTimes } : null;
  }, [fields, getTimeSeries]);
}
