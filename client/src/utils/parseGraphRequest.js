/**
 * Parse natural language graph request - Hebrew + English, fuzzy matching
 * e.g. "הצג Roll ו-Pitch באדום וכחול", "now add the GPS speed", "הוסף מהירות GPS"
 */
const colorMap = {
  אדום: '#f85149', כחול: '#58a6ff', ירוק: '#3fb950', צהוב: '#d29922', סגול: '#a371f7', כתום: '#d29922',
  red: '#f85149', blue: '#58a6ff', green: '#3fb950', yellow: '#d29922', purple: '#a371f7', orange: '#d29922',
};

// ArduPilot field aliases - Hebrew + English, covers all common log types
const FIELD_ALIASES = {
  // Attitude
  roll: ['Roll', 'NavRoll', 'DesRoll'],
  pitch: ['Pitch', 'NavPitch', 'DesPitch'],
  yaw: ['Yaw', 'DesYaw', 'NavYaw'],
  גלגול: ['Roll', 'NavRoll'],
  עלרוד: ['Pitch', 'NavPitch'],
  סיבוב: ['Yaw', 'DesYaw'],
  // Speed & altitude
  speed: ['Spd', 'GSpd', 'Aspd', 'VSpd', 'Speed'],
  altitude: ['Alt', 'RelAlt', 'BarAlt', 'Alt'],
  מהירות: ['Spd', 'GSpd', 'Aspd', 'VSpd'],
  גובה: ['Alt', 'RelAlt', 'BarAlt'],
  // Throttle
  throttle: ['Thr', 'ThrOut', 'ThrIn', 'ThO', 'ThD'],
  מצערת: ['Thr', 'ThrOut', 'ThO'],
  // GPS
  satellites: ['NSats'],
  לוויינים: ['NSats'],
  לווינים: ['NSats'],
  לווין: ['NSats'],
  כמות: ['NSats'],
  sats: ['NSats'],
  status: ['Status'],
  סטטוס: ['Status'],
  hdop: ['HDop'],
  דיוק: ['HDop'],
  course: ['GCrs', 'Crs'],
  כיוון: ['GCrs', 'Crs'],
  lat: ['Lat'],
  lng: ['Lng'],
  'קו רוחב': ['Lat'],
  'קו אורך': ['Lng'],
  // Baro / pressure
  pressure: ['Press', 'BPrs'],
  לחץ: ['Press', 'BPrs'],
  temp: ['Temp', 'CTemp'],
  טמפרטורה: ['Temp', 'CTemp'],
  // Battery
  voltage: ['Volt', 'V'],
  מתח: ['Volt', 'V'],
  current: ['Curr', 'C'],
  זרם: ['Curr', 'C'],
  battery: ['Volt', 'Curr', 'RemPct'],
  סוללה: ['Volt', 'Curr', 'RemPct'],
  בטריה: ['Volt', 'Curr', 'RemPct'],
  percent: ['RemPct'],
  אחוז: ['RemPct'],
  // RC
  rc: ['chan1', 'chan2', 'chan3', 'chan4'],
  ערוץ: ['chan1', 'chan2', 'chan3', 'chan4'],
  // IMU / gyro / accel
  gyro: ['GyrX', 'GyrY', 'GyrZ'],
  גירו: ['GyrX', 'GyrY', 'GyrZ'],
  accel: ['AccX', 'AccY', 'AccZ'],
  תאוצה: ['AccX', 'AccY', 'AccZ'],
  // Navigation
  target: ['NavRoll', 'NavPitch', 'NavYaw', 'DesRoll', 'DesPitch', 'DesYaw'],
  מבוקש: ['NavRoll', 'NavPitch', 'NavYaw'],
  desired: ['DesRoll', 'DesPitch', 'DesYaw'],
  רצוי: ['DesRoll', 'DesPitch', 'DesYaw'],
};

const MESSAGE_ALIASES = {
  gps: ['GPS', 'GPS2', 'GPS3'],
  att: ['ATT', 'AHR2', 'AHR3'],
  ctun: ['CTUN', 'NTUN'],
  baro: ['BARO', 'BAR2', 'BAR3'],
  imu: ['IMU', 'IMU2', 'IMU3'],
  batt: ['BATT', 'BAT2', 'BAT3', 'BAT4', 'CURR', 'POWR'],
  rcin: ['RCIN', 'RCI2'],
  rcou: ['RCOU', 'RCO2'],
  rc: ['RCIN', 'RCOU', 'RCI2', 'RCO2'],
};

const NOISE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'ו', 'באדום', 'בכחול', 'בצהוב', 'בירוק', 'בסגול',
  'הצג', 'הראה', 'גרף', 'גרפים', 'now', 'please', 'in', 'with', 'לבנה', 'לשחור',
  'show', 'display', 'plot', 'graph', 'graphe', 'graphs', 'chart', 'charts',
  'add', 'to', 'of',
  'רוצה', 'לראות', 'ראה', 'כמה', 'איך', 'מה', 'את', 'של', 'על', 'ב', 'אני', 'תוסיף', 'גם',
  'want', 'see', 'saw', 'how', 'many', 'much', 'what', 'which',
]);

const DEFAULT_COLORS = ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7', '#79c0ff', '#ff7b72', '#56d364'];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/([\u0590-\u05FF])([A-Za-z0-9])|([A-Za-z0-9])([\u0590-\u05FF])/g, (_, h, l, l2, h2) => (h ? `${h} ${l}` : `${l2} ${h2}`))
    .replace(/[\u0590-\u05FF]+/g, (m) => ` ${m} `)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !NOISE_WORDS.has(t));
}

function extractColors(text) {
  const colorOrder = [];
  const re = new RegExp(Object.keys(colorMap).join('|'), 'gi');
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = Object.keys(colorMap).find((k) => k.toLowerCase() === m[0].toLowerCase());
    if (key && !colorOrder.includes(colorMap[key])) colorOrder.push(colorMap[key]);
  }
  return colorOrder;
}

function scoreField(textTokens, fieldFull, fieldName, msgName) {
  let score = 0;
  const tokens = new Set(textTokens);

  if (tokens.has(fieldName.toLowerCase())) score += 10;
  if (tokens.has(msgName.toLowerCase())) score += 5;

  for (const [alias, targets] of Object.entries(FIELD_ALIASES)) {
    if (targets.includes(fieldName) && tokens.has(alias)) score += 8;
  }
  for (const [alias, targets] of Object.entries(MESSAGE_ALIASES)) {
    if (targets.includes(msgName) && tokens.has(alias)) score += 4;
  }

  if (fieldName.toLowerCase().includes('spd') && (tokens.has('speed') || tokens.has('מהירות'))) score += 6;
  if (fieldName.toLowerCase().includes('alt') && (tokens.has('altitude') || tokens.has('גובה'))) score += 6;
  if (fieldName.toLowerCase().includes('roll') && (tokens.has('roll') || tokens.has('גלגול'))) score += 6;
  if (fieldName.toLowerCase().includes('pitch') && (tokens.has('pitch') || tokens.has('עלרוד'))) score += 6;

  if (tokens.has('gps') && msgName.startsWith('GPS') && (tokens.has('speed') || tokens.has('מהירות') || fieldName.toLowerCase().includes('spd'))) score += 7;
  if (tokens.has('gps') && msgName.startsWith('GPS') && (tokens.has('לוויינים') || tokens.has('לווינים') || tokens.has('satellites') || fieldName.toLowerCase() === 'nsats')) score += 9;

  return score;
}

export function parseGraphRequest(text, availableFields, currentSelected = []) {
  if (!text?.trim() || !availableFields?.length) return { fields: [], append: false };

  const tokens = tokenize(text);
  const colorOrder = extractColors(text);

  const ADD_PHRASES = /(הוסף|עוד|גם|בנוסף|תוסיף|ותוסיף|על גבי|גם את|וכן|add|also|plus|and also|now add)/i;
  const REPLACE_PHRASES = /(החלף|במקום|מחק|הסר|replace|instead|clear|only\s+show)/i;
  const append = ADD_PHRASES.test(text) && !REPLACE_PHRASES.test(text);

  const scored = [];
  for (const fieldFull of availableFields) {
    const dot = fieldFull.indexOf('.');
    const msgName = dot > 0 ? fieldFull.slice(0, dot) : '';
    const fieldName = dot > 0 ? fieldFull.slice(dot + 1) : fieldFull;
    const s = scoreField(tokens, fieldFull, fieldName, msgName);
    if (s > 0) scored.push({ field: fieldFull, score: s });
  }

  scored.sort((a, b) => b.score - a.score);

  const result = scored
    .filter((s) => s.score >= 4)
    .slice(0, 8)
    .map((s) => s.field);

  const REQUEST_VERBS = /(הצג|הראה|הוסף|גם|עוד|show|display|add|plot|graph)/i;
  const looksLikeRequest = REQUEST_VERBS.test(text) || tokens.length >= 1;
  const notFound = result.length === 0 && looksLikeRequest && text.trim().length > 2;

  function suggestSimilar() {
    if (!notFound || !availableFields.length) return [];
    const priority = ['ATT.Roll', 'ATT.Pitch', 'ATT.Yaw', 'GPS.NSats', 'GPS.Spd', 'GPS.GSpd', 'GPS.Status', 'BARO.Alt', 'CTUN.Alt', 'GPS.Alt', 'RCOU.Thr', 'CTUN.ThrOut', 'BATT.Volt', 'BATT.Curr'];
    const byPriority = [];
    for (const p of priority) {
      if (availableFields.includes(p)) byPriority.push(p);
    }
    const rest = availableFields.filter((f) => !byPriority.includes(f)).slice(0, 6 - byPriority.length);
    return [...byPriority, ...rest].slice(0, 6);
  }

  return {
    fields: result.map((name, i) => ({
      name,
      color: colorOrder[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    })),
    append,
    notFound,
    suggested: notFound ? suggestSimilar() : [],
  };
}

