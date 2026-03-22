/**
 * Build per-path-point navigation heading (deg, 0=N, 90=E, clockwise).
 * For each GPS path timestamp, use the first field that yields a valid sample.
 */

const HEADING_FIELDS = [
  'ATT.Yaw',
  'ATT.DesYaw',
  'GPS.GCrs',
  'GPS.Crs',
  'ATT.NavYaw',
];

/**
 * ArduPilot often stores course/yaw in centidegrees; some exports are already degrees.
 * If |value| > 360, treat as centidegrees and divide by 100.
 */
export function normalizeHeadingDegrees(raw, fieldKey) {
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  let v = Number(raw);
  const k = fieldKey || '';
  const apHeading = /\.(GCrs|Crs|Yaw|DesYaw|NavYaw)$/.test(k);
  if (apHeading && Math.abs(v) > 360) v /= 100;
  v %= 360;
  if (v < 0) v += 360;
  return v;
}

export function buildPathNavHeadingsDeg(pathTimes, fields, getTimeSeries, interpolateAtTime) {
  if (!pathTimes?.length || !fields?.length || !getTimeSeries || !interpolateAtTime) return null;
  const out = [];
  for (let i = 0; i < pathTimes.length; i += 1) {
    const t = pathTimes[i];
    let h = null;
    for (const key of HEADING_FIELDS) {
      if (!fields.includes(key)) continue;
      const ts = getTimeSeries(key);
      const raw = interpolateAtTime(ts?.x, ts?.y, t);
      if (raw == null || !Number.isFinite(Number(raw))) continue;
      h = normalizeHeadingDegrees(raw, key);
      if (h != null) break;
    }
    out.push(h);
  }
  return out.some((x) => x != null) ? out : null;
}
