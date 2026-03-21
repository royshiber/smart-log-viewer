/**
 * Map log sample time (TimeUS, µs since boot) to absolute UTC using GPS GWk + GMS.
 * Aligned with ArduPilot DataFlash: GPS time = GPS epoch ms + week*msPerWeek + GMS.
 */

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
/** GPS epoch to Unix ms (1980-01-06 00:00 UTC), before leap-second tweak */
const UNIX_GPS_EPOCH_MS = 315964800 * 1000;
const GPS_OK_FIX_3D = 3;

function leapSecondsGpsApprox(year, month) {
  const yyyymm = year * 100 + month;
  if (yyyymm >= 201701) return 18;
  if (yyyymm >= 201507) return 17;
  if (yyyymm >= 201207) return 16;
  if (yyyymm >= 200901) return 15;
  if (yyyymm >= 200601) return 14;
  if (yyyymm >= 199901) return 13;
  if (yyyymm >= 199707) return 12;
  if (yyyymm >= 199601) return 11;
  return 10;
}

function gpsToUnixMs(week, msInWeek) {
  let unix = UNIX_GPS_EPOCH_MS + week * MS_PER_WEEK + msInWeek;
  const d = new Date(unix);
  const ls = leapSecondsGpsApprox(d.getUTCFullYear(), d.getUTCMonth() + 1);
  return unix - ls * 1000;
}

function pickGpsMessage(messages) {
  if (!messages || typeof messages !== 'object') return null;
  const keys = Object.keys(messages).filter((k) => k === 'GPS' || /^GPS\[\d+\]$/.test(k));
  for (const k of keys) {
    const m = messages[k];
    if (m?.TimeUS?.length && m?.GWk?.length && m?.GMS?.length && m?.Status?.length) return m;
  }
  return null;
}

/**
 * @returns {function(number): { utcIso: string, israelLocal: string } | null}
 */
export function buildTimeToWallClock(messages) {
  const gps = pickGpsMessage(messages);
  if (!gps) return null;

  const tus = gps.TimeUS;
  const wk = gps.GWk;
  const gms = gps.GMS;
  const st = gps.Status;
  const n = Math.min(tus.length, wk.length, gms.length, st.length);

  const points = [];
  for (let i = 0; i < n; i++) {
    if (st[i] < GPS_OK_FIX_3D) continue;
    if (wk[i] < 1000 || gms[i] <= 0) continue;
    points.push({
      tus: Number(tus[i]),
      unixMs: gpsToUnixMs(Number(wk[i]), Number(gms[i])),
    });
  }
  if (points.length === 0) return null;

  points.sort((a, b) => a.tus - b.tus);

  const fmtUtc = (unixMs) => {
    const d = new Date(unixMs);
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
  };

  const fmtIl = (unixMs) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(unixMs));

  function unixAtTus(t) {
    const tt = Number(t);
    if (points.length === 1) {
      const p0 = points[0];
      return p0.unixMs + (tt - p0.tus) / 1000;
    }
    if (tt <= points[0].tus) {
      const p0 = points[0];
      const p1 = points[1];
      const dus = p1.tus - p0.tus || 1;
      const rate = (p1.unixMs - p0.unixMs) / dus;
      return p0.unixMs + (tt - p0.tus) * rate;
    }
    const last = points[points.length - 1];
    if (tt >= last.tus) {
      const pPrev = points[points.length - 2];
      const dus = last.tus - pPrev.tus || 1;
      const rate = (last.unixMs - pPrev.unixMs) / dus;
      return last.unixMs + (tt - last.tus) * rate;
    }
    let lo = 0;
    let hi = points.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (points[mid].tus <= tt) lo = mid;
      else hi = mid;
    }
    const a = points[lo];
    const b = points[hi];
    const dus = b.tus - a.tus || 1;
    const frac = (tt - a.tus) / dus;
    return a.unixMs + frac * (b.unixMs - a.unixMs);
  }

  return (t) => {
    const unixMs = unixAtTus(t);
    if (!Number.isFinite(unixMs)) return null;
    return { utcIso: fmtUtc(unixMs), israelLocal: fmtIl(unixMs) };
  };
}
