/** App version - increment on each change */
export const APP_VERSION = '1.02.39';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון מסך לוגים תקוע: vehicle חסר ברשימה — לא נשארים ב"טוען..." לנצח; סנכרון מ-IndexedDB
2. "הוסף כטב״ם חדש" מהמסך הראשי: מרענן את רשימת הכטב״מים מהמסד (לא מערך stale)`,
  en: `1. Fix stuck logs screen when vehicle missing from parent state — no infinite loading; resync from IndexedDB
2. "Add new vehicle" from landing: refresh vehicle list from DB (avoid stale array)`,
};
