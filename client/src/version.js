/** App version - increment on each change */
export const APP_VERSION = '1.02.24';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון דוחות סופי: מינימום רוחב עמודות CSV/PDF נעשה דינמי לפי רוחב אמיתי, כך שאין דריסה של Gemini
2. איזון רוחב בדוחות שופר: גם במסכים צרים אין חפיפה — העמודות מצטמצמות בצורה חכמה
3. טווח גוללי דוחות הותאם מחדש לטווח אפקטיבי אמיתי`,
  en: `1. Final reports fix: CSV/PDF minimum panel width is now dynamic by real available space, preventing Gemini overlap
2. Improved reports width balancing: no overlap on narrow screens — panels shrink intelligently
3. Reports slider ranges were recalibrated to the true effective resize span`,
};
