/** App version - increment on each change */
export const APP_VERSION = '1.02.20';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון סופי לדוחות: עמודות CSV/PDF נשארות תמיד בתוך רוחב המסך ולא בורחות מתחת לצ'אט Gemini
2. איזון חכם בזמן גרירה: הרחבת עמודת CSV/PDF מצמצמת אוטומטית את העמודה השנייה במקום ליצור חפיפה
3. תיקון דוח PDF: כפתור "הפק דוח" עובד גם בלי בחירת שדות מוקדמת בגרף, לפי השדות שסומנו במסך הדוחות
4. תיקון סטטוס Gemini: מניעת "נקודה אדומה שקרית" בנפילות בדיקת סטטוס זמניות`,
  en: `1. Final reports layout fix: CSV/PDF panels now always stay within visible width and never slide behind Gemini chat
2. Smart resize balancing: expanding CSV/PDF automatically reduces the other panel instead of creating overlap
3. PDF report fix: "Generate report" now works without pre-selecting chart fields by using fields selected in Reports
4. Gemini status fix: prevents false-red indicator on transient status-check failures`,
};
