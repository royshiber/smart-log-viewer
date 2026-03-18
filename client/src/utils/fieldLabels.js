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
};

export function getFieldLabel(fieldKey, lang = 'he') {
  const fieldName = fieldKey.includes('.') ? fieldKey.split('.')[1] : fieldKey;
  const msgName = fieldKey.includes('.') ? fieldKey.split('.')[0] : '';
  const heLabel = FIELD_LABELS_HE[fieldName];
  if ((lang === 'he' || lang?.startsWith('he')) && heLabel) {
    return `${heLabel} (${fieldName})`;
  }
  return fieldKey;
}
