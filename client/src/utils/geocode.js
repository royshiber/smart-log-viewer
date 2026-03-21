/** Reverse geocoding via Nominatim (OpenStreetMap) - free, no API key */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'SmartLogViewer/1.0 (flight log analysis)';
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Get nearest city/town/village from coordinates.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} City name or "Unknown"
 */
export async function getNearestCity(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return 'Unknown';
  await throttle();
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'he,he-IL;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return 'Unknown';
    const data = await res.json();
    const addr = data?.address;
    if (!addr) {
      if (typeof data?.display_name === 'string' && /[\u0590-\u05FF]/.test(data.display_name)) {
        return data.display_name.split(',')[0].trim();
      }
      return 'Unknown';
    }
    const place =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state;
    if (place) return place;
    if (typeof data?.display_name === 'string') {
      return data.display_name.split(',')[0].trim();
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}
