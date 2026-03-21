/**
 * Log display name helpers.
 * Format: "{city} {DD.MM.YY} {vehicleName}"
 * Example: "נתניה 18.03.26 Phoenix"
 */

/**
 * Extract flight date from parsed messages (first GPS or any timestamp).
 * @param {Object} messages - Parsed messages from DataflashParser
 * @returns {string} YYYY-MM-DD or fallback to today
 */
export function extractFlightDate(messages) {
  if (!messages || typeof messages !== 'object') {
    return new Date().toISOString().slice(0, 10);
  }
  let firstUs = null;
  let firstMs = null;
  for (const msg of Object.values(messages)) {
    if (msg?.TimeUS?.length) firstUs = firstUs ?? msg.TimeUS[0];
    if (msg?.time_boot_ms?.length) firstMs = firstMs ?? msg.time_boot_ms[0];
  }
  if (firstUs != null && firstUs > 1e12) {
    const d = new Date(firstUs / 1000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (firstMs != null && firstMs > 1e12) {
    const d = new Date(firstMs);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Format YYYY-MM-DD → DD.MM.YY
 */
function formatDate(isoDate) {
  const [y, m, d] = (isoDate || '').split('-');
  if (!y || !m || !d) return isoDate || '';
  return `${d}.${m}.${y.slice(2)}`;
}

/**
 * Build display name: "{city} {DD.MM.YY} {vehicleName} טיסה {N}"
 * @param {string} vehicleName
 * @param {string} nearestCity
 * @param {string} flightDate  YYYY-MM-DD
 * @param {boolean} hasGps
 */
export function buildLogDisplayName(vehicleName, nearestCity, flightDate, hasGps = true, flightNumber = 1) {
  const city = hasGps ? (nearestCity || 'Unknown') : 'NoGPS';
  const date = formatDate(flightDate || new Date().toISOString().slice(0, 10));
  const vehicle = (vehicleName || '').trim() || 'לוג';
  const n = Number.isFinite(Number(flightNumber)) ? Math.max(1, Number(flightNumber)) : 1;
  return `${city} ${date} ${vehicle} טיסה ${n}`;
}
