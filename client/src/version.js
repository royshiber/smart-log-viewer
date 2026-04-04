/** App version - increment on each change */
export const APP_VERSION = '1.02.47';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. mLRS Configurator: משיכת פרויקט Stitch — npm run fetch:stitch-mlrs (מפתח ב־server/.env) → docs/stitch-mlrs-configurator/; ממשק מסונכרן לייצוא מסך 05 (Space Grotesk, #111416 / #f4af2a / #664500, bezel מסוף, טאבי צד כמו Stitch)
2. Vision Landing Console: טאב ראשי ״לוגים והעלאות״ לפאנל שהיה מנותק מהניווט; סקריפט בדיקות npm run test:smoke (API + Playwright) ב־apps/vision-landing-console
3. STEP Collector: npm run fetch:stitch-project → docs/stitch-step-collector/; ממשק כמו Stitch Main View (סרגל צד, 35/65, שורות סטטוס, צבעים #003164 / #00478d / #1b6d24 מהייצוא)
4. Vision Landing Console: תיקון תת-טאבי ArduPilot (הסתרת פאנלים שלא נבחרו); סיבוב מפה — סליידר + כפתורי ±15° + N; ייחוס ניווט לפי תמונה — כרטיס ברור עם רדיו במקום כפתורים בצפיפות בסרגל
5. Vision Landing Console: ניהול גרסת קוד Jetson בטאב טלמטריה; ייחוס ניווט ב־API+SSE (גרסאות קודמות כללו גם חוגת סיבוב שהוחלפה ב־1.02.41)
6. mLRS Configurator: מדריך צד מלוטש — כותרות, בלוקי קוד נפרדים, קישורי מקור (pill), עמודה מרכזית בעטיפה, יישור שורת כלים ו־?
7. mLRS Configurator: קירוב ל-Stitch — טאבי CONFIG/FLASHING/CLI/FILES, CONNECT בכותרת, פס תחתון LINK/CONNECTED, טיפוגרפיה גדולה יותר, טאבים LTR ברורים
8. mLRS Configurator: ממשק Stitch — רשת 3 עמודות, סרגל עליון, מסוף צהוב על שחור, פס סטטוס; שמירה על כל ה-id והפקודות
9. Vision Landing Console: תיקון /api/flights/all-logs (עמודת created_at), סדר נתיבים, מאזין 0.0.0.0 + הודעה כשהפורט תפוס; טבלת ״כל הלוגים״ + כפתורי משיכה/רענון מחוברים; העלאה עם מקור auto מותרת בטופס
10. mLRS Configurator: הודעות שגיאה ברורות כשהשרת על 3001 לא זמין או כשהתשובה אינה JSON (במקום ״Internal Server Error״ בלבד)
11. Vision Landing Console (:4010): ממשק מלא במונוריפו — טאבים (מרכז פרמטרים, תחקור, תהליכים, טלמטריה, מפה טריין, יועץ), שרת SQLite + העלאות + Gemini
12. mLRS Configurator: מסך יחיד ללא גלילה, טופס פרמטרים, עוזר AI, פרוקסי /api
13. STEP Collector: CustomTkinter, Playwright, Captcha ידני, ארגון קבצים
14. STEP Collector (Windows): ניסיון Chrome אוטומטי לפני Chromium; CI גם על master`,
  en: `1. mLRS Configurator: Stitch project fetch — npm run fetch:stitch-mlrs (key in server/.env) → docs/stitch-mlrs-configurator/; UI aligned to exported screen 05 (Space Grotesk, Material tokens, terminal bezel, sidebar tabs)
2. Vision Landing Console: main tab "Logs & uploads" for previously orphaned flights panel; automated smoke tests via npm run test:smoke (API + Playwright)
3. STEP Collector: npm run fetch:stitch-project → docs/stitch-step-collector/; UI matches Stitch Main View export (sidebar, 35/65 columns, horizontal status rows, #003164 / #00478d / #1b6d24 palette)
4. Vision Landing Console: ArduPilot category tabs fixed (hide inactive panels); map rotation — slider + ±15° + N; image-nav reference — dedicated card with radios instead of cramped toolbar
5. Vision Landing Console: Jetson bundle version UI in Telemetry tab; image-nav via API + SSE (dial rotation replaced by slider in 1.02.41)
6. mLRS Configurator: polished manual — section headings, code blocks, GitHub pill links; centered column card; tool row + help alignment
7. mLRS Configurator: closer to Stitch — CONFIG/FLASHING/CLI/FILES chrome, CONNECT in header, LINK/CONNECTED dock, larger type, clearer LTR tabs
8. mLRS Configurator: Stitch-style UI — 3-column grid, top chrome, amber-on-black terminal, status bar; same IDs and CLI behaviour
9. Vision Landing Console: fix /api/flights/all-logs (created_at column), route order, bind 0.0.0.0 + clear message on port in use; wire “all logs” table and pull/refresh buttons; allow auto log source in upload form
10. mLRS Configurator: clearer errors when :3001 is down or response is not JSON (instead of bare Internal Server Error)
11. Vision Landing Console (:4010): full UI in monorepo — tabs (parameters, debrief, processes, telemetry, terrain map, advisor), SQLite server + uploads + Gemini
12. mLRS Configurator: single viewport, parameter form, AI assistant, /api proxy
13. Desktop STEP Collector: CustomTkinter, Playwright, manual Captcha, file layout
14. STEP Collector (Windows): auto-try Chrome before Playwright Chromium; CI also on master`,
};
