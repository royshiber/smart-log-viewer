/**
 * Hebrew labels for log fields - for display in chart legend
 */
export const FIELD_LABELS_HE = {
  Roll: 'גלגול',
  NavRoll: 'גלגול מבוקש',
  DesRoll: 'גלגול רצוי',
  Pitch: 'עלרוד',
  NavPitch: 'עלרוד מבוקש',
  DesPitch: 'עלרוד רצוי',
  Yaw: 'סיבוב',
  DesYaw: 'סיבוב רצוי',
  NavYaw: 'סיבוב מבוקש',
  Alt: 'גובה',
  RelAlt: 'גובה יחסי',
  BarAlt: 'גובה ברומטרי',
  Spd: 'מהירות',
  GSpd: 'מהירות קרקע',
  Aspd: 'מהירות אוויר',
  VSpd: 'מהירות אנכית',
  Thr: 'מצערת',
  ThrOut: 'פלט מצערת',
  ThrIn: 'כניסת מצערת',
  ThO: 'מצערת',
  ThD: 'מצערת מבוקשת',
  NSats: 'מספר לוויינים',
  Status: 'סטטוס GPS',
  HDop: 'דיוק אופקי',
  GCrs: 'כיוון',
  Lat: 'קו רוחב',
  Lng: 'קו אורך',
  Press: 'לחץ',
  BPrs: 'לחץ ברומטרי',
  Temp: 'טמפרטורה',
  CTemp: 'טמפרטורה',
  Volt: 'מתח',
  Curr: 'זרם',
  RemPct: 'אחוז סוללה',
  GyrX: 'גירו X',
  GyrY: 'גירו Y',
  GyrZ: 'גירו Z',
  AccX: 'תאוצה X',
  AccY: 'תאוצה Y',
  AccZ: 'תאוצה Z',
  Rdo: 'ערוץ פלט',
  As: 'מהירות אוויר',
  E2T: 'טמפ. מנוע',
  SAlt: 'גובה מנוע',
  DAlt: 'גובה יעד',
  BAlt: 'גובה ברומטרי',
  DS: 'מהירות ירידה',
  DCRt: 'קצב פנייה',
  CRt: 'קצב פנייה נוכחי',
  Tthr: 'מצערת מטרה',
  SRate: 'קצב סיבוב',
  TimeUS: 'זמן',
  GMS: 'זמן GPS',
  GWk: 'שבוע GPS',
};

const MSG_HINT_HE = {
  CTUN: 'בקרת טיסה',
  GPS: 'GPS',
  ATT: 'ייחוס',
  BARO: 'ברומטר',
  RCOU: 'פלט מ״מ',
  BATT: 'סוללה',
  IMU: 'IMU',
  RCOU2: 'פלט מ״מ',
  GPS2: 'GPS משני',
};

/** Short Hebrew hint (1–3 words) for CSV / lists */
export function getShortHeHint(fieldKey) {
  const dot = fieldKey.indexOf('.');
  const msg = dot > 0 ? fieldKey.slice(0, dot).replace(/\[\d+\]/, '') : '';
  const fn = dot > 0 ? fieldKey.slice(dot + 1) : fieldKey;
  const full = FIELD_LABELS_HE[fn];
  if (full) return full.split(/\s+/).slice(0, 3).join(' ');
  const mh = MSG_HINT_HE[msg] || 'נתון';
  return `${mh} · ${fn}`;
}

export function getFieldLabel(fieldKey, lang = 'he') {
  const fieldName = fieldKey.includes('.') ? fieldKey.split('.')[1] : fieldKey;
  const msgName = fieldKey.includes('.') ? fieldKey.split('.')[0] : '';
  const heLabel = FIELD_LABELS_HE[fieldName];
  if ((lang === 'he' || lang?.startsWith('he')) && heLabel) {
    return `${heLabel} (${fieldName})`;
  }
  return fieldKey;
}

/** Build mapping: fieldKey -> Hebrew label, for Gemini context */
export function buildFieldLabelsMap(fields) {
  const map = {};
  for (const f of fields || []) {
    const fn = f.includes('.') ? f.split('.')[1] : f;
    if (FIELD_LABELS_HE[fn]) map[f] = FIELD_LABELS_HE[fn];
  }
  return map;
}
