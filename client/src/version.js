/** App version - increment on each change */
export const APP_VERSION = '1.02.37';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקון Render "Not Found": התקנת client עם --include=dev כדי ש-Vite ייבנה תחת NODE_ENV=production
2. שרת: הודעת 503 ברורה אם חסר client/dist; fallback ל-index.html`,
  en: `1. Fix Render "Not Found": client install uses --include=dev so Vite runs under NODE_ENV=production
2. Server: clear 503 if client/dist missing; SPA index fallback`,
};
