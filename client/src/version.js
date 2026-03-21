/** App version - increment on each change */
export const APP_VERSION = '1.02.18';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון מסך דוחות: סליידר רוחב CSV שולט כעת בפועל על רוחב העמודה
2. תיקון רוחב PDF: מינימום אמיתי, וסידור גלילה אופקית שמונע היעלמות מאחורי פנל Gemini
3. תיקון סטטוס Gemini: מניעת "נקודה אדומה שקרית" בנפילות בדיקת סטטוס זמניות
4. דוח PDF מקצועי חדש: פורמט הנדסי מלא עם Executive Summary, Key Findings, טבלת מדדים מתקדמת ומסקנות פעולה
5. שדרוג אנליטיקה לדוח: STD, P95, Trend, Risk level ותובנה/המלצה לכל פרמטר`,
  en: `1. Reports screen fix: CSV width slider now controls real column width
2. PDF panel width fix: true minimum width and horizontal scroll layout prevent hiding behind Gemini panel
3. Gemini status fix: prevents false-red indicator on transient status-check failures
4. New professional PDF report format: full engineering structure with Executive Summary, Key Findings, advanced metrics table, and action-oriented conclusions
5. Upgraded report analytics: STD, P95, Trend, Risk level, plus per-parameter insight and recommendation`,
};
