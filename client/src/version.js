/** App version - increment on each change */
export const APP_VERSION = '1.02.19';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון דוח PDF: כפתור "הפק דוח" עובד גם בלי בחירת שדות מוקדמת בגרף, לפי השדות שסומנו במסך הדוחות
2. תיקון מסך דוחות: סליידר רוחב CSV שולט כעת בפועל על רוחב העמודה
3. תיקון רוחב PDF: מינימום אמיתי, וסידור גלילה אופקית שמונע היעלמות מאחורי פנל Gemini
4. תיקון סטטוס Gemini: מניעת "נקודה אדומה שקרית" בנפילות בדיקת סטטוס זמניות`,
  en: `1. PDF report fix: "Generate report" now works without pre-selecting chart fields by using fields selected in Reports
2. Reports screen fix: CSV width slider now controls real column width
3. PDF panel width fix: true minimum width and horizontal scroll layout prevent hiding behind Gemini panel
4. Gemini status fix: prevents false-red indicator on transient status-check failures`,
};
