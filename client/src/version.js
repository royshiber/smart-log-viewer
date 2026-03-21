/** App version - increment on each change */
export const APP_VERSION = '1.02.21';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון עמודת לוגים: אזור פעולות חכם עם גלילה פנימית וצמצום/פתיחה כדי למנוע חפיפות בעומס
2. שיפור כרטיסי השוואה: רשימת השוואות מוגבלת גובה וניתנת לגלילה כדי למנוע עלייה אחד על השני
3. ייצוא CSV: עמודת זמן ישראל תמיד קיימת ומחושבת לפי GWk+GMS (עם fallback פנימי לנתוני סדרות)`,
  en: `1. Logs column fix: smart tools area with internal scrolling and collapse/expand to prevent overlap under heavy content
2. Comparison cards improvement: fixed-height scrollable comparison list to avoid stacking collisions
3. CSV export: Israel local-time column is always included and computed from GWk+GMS (with internal series fallback)`,
};
