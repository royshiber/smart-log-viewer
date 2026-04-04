# Task backlog — מעקב משימות

קובץ זה משמש **אותך** ואת העוזר ב-Cursor לעקוב אחרי בקשות שלא הושלמו או שצריך לחזור אליהן.

> Cursor אינו מריץ תוסף חיצוני אוטומטי; זה **מקור אמת ב-repo** שניתן לפתוח, לערוך ולסנכרן ב-Git.

## איך משתמשים

| פעולה | מה לעשות |
|--------|-----------|
| משימה חדשה | הוסף שורה תחת **פתוחות** עם מזהה `T-###` |
| הושלמה | העבר ל-**הושלמו** עם תאריך וקישור ל-commit או לגרסה |
| סירוב / בוטל | העבר ל-**בוטלו** עם סיבה קצרה |

## פתוחות

- [ ] **T-029** — הרחבת mLRS Configurator: עורך פרמטרים מובנה (פארס ל־`pl tx`/`pl rx`), מילוי שורת המידע מ־`v;`, תרגום מלא EN↔HE (אופציונלי: Node+serialport ללא Chrome).
- [ ] **T-002** — לחבר סקריפט `mavlink_udp_bridge.py` ל-Jetson אמיתי ולוודא telemetry בקצב 5-10Hz (דורש חומרה).
- [ ] **T-019** — דיבוג תקלה: Gemini לא עובד (איסוף לוגים בזמן ריצה, זיהוי שורש תקלה ותיקון מאומת).
- [x] **T-020** — הוספת ניהול גרסאות ב-JETSON: הצגת גרסה מותקנת, בחירת גרסה להתקנה/rollback, וכפתור התקנה ברור עם היסטוריית התקנות במסך (2026-04-03, גרסה 1.02.57).
- [x] **T-021** — חיבור API אמיתי לניהול גרסאות JETSON ב-Aero-Lab (releases/status/install), שמירת state בצד שרת, ואינטגרציה אופציונלית לשירות companion דרך env (2026-04-03, גרסה 1.02.58).
- [x] **T-022** — Vision Landing Console בתוך הריפו: `apps/vision-landing-console` על פורט 4010, מסך עברית עם כרטיס JETSON (גרסה מותקנת + התקנה/Rollback) ו־V בראש מסונכרן ל־`client/src/version.js` (2026-04-03, גרסה 1.02.59).
- [x] **T-023** — הבהרה ותיקון launcher: הממשק המלא (V1.01.x / מרכז פרמטרים) אינו בקוד הריפו; `start-vision-landing-console.bat` תומך ב־`vision-landing-console-home.txt` לנתיב לפרויקט האמיתי (2026-04-03, גרסה 1.02.61).
- [x] **T-024** — קיצור דרך חדש ל-Smart Log Viewer + שיפור `create-desktop-shortcut.ps1` (אייקון דרך LOCALAPPDATA) (2026-04-03, גרסה 1.02.62).
- [x] **T-025** — תיקון בלבול: קיצור נחיתה לפי תמונה בשם `נחיתה לפי תמונה.lnk` + עדכון `create-vision-landing-shortcut.ps1` (לא Log Viewer) (2026-04-03, גרסה 1.02.63).
- [x] **T-026** — תיקון קידוד: שם הקיצור בעברית נבנה מ־char codes ב-PS1 (2026-04-03, גרסה 1.02.64).
- [x] **T-027** — Vision Landing Console: ניווט טאבים אמיתי ב־`apps/vision-landing-console/public/index.html` (פאנלים + לחיצה), במקום כפתורים ללא לוגיקה (2026-04-04, גרסה 1.02.65).
- [x] **T-031** — Vision Landing Console: תיקון טאבים — רק `main > section.tab-panel` + `hidden`, סנכרון לטאב `.active` בטעינה (2026-04-04, גרסה 1.02.68).
- [x] **T-028** — mLRS CLI Console: אפליקציית דפדפן (`apps/mlrs-cli-console`, Web Serial 115200) לפקודות CLI של mLRS במקום Lua בשלט; `npm run dev:mlrs-cli` (2026-04-04, גרסה 1.02.67).
- [x] **T-030** — mLRS Configurator לשולחן העבודה: עיצוב בסגנון `mLRS.lua`, גשר `server/tcp-ws-bridge.mjs` (TCP מודול WiFi ↔ WS מקומי), `start-mlrs-configurator.bat`, מצבי חיבור Serial/WiFi (2026-04-04, גרסה 1.02.70).
- [x] **T-033** — קיצור שולחן עבודה `mLRS Configurator.lnk` + `mlrs-configurator.ico` (בנייה מ־`scripts/build-mlrs-configurator-icon.ps1`), `create-mlrs-configurator-shortcut.ps1` (2026-04-04, גרסה 1.02.73).
- [x] **T-034** — mLRS Configurator: פאנל עברית — `heContent.js` (ספר הוראות לפי CLI/Lua/WIRELESS_BRIDGE/MATEKSYS), סימני ? + הסבר אחרי פעולה (2026-04-04, גרסה 1.02.31).
- [x] **T-035** — mLRS Configurator: טופס פרמטרים מהיר + צ'אט `/api/mlrs-chat` + `server/mlrsAssistantKnowledge.js` + Vite proxy ל-3001 (2026-04-04, גרסה 1.02.32).
- [x] **T-036** — mLRS Configurator: פריסת חלון יחיד ללא גלילת דף (`100vh`, לוג מוגבל בשורות, צ'אט/מדריך מצומצמים) (2026-04-04, גרסה 1.02.33).
- [x] **T-032** — Vision Landing Console: שחזור מסך יחיד ללא טאבים (הסרת placeholders) — `apps/vision-landing-console/public/index.html` (2026-04-04, גרסה 1.02.71).
- [x] **T-033** — החזרת `APP_VERSION` ב־`client/src/version.js` ל־**1.02.30** לפי בקשה (תג V ב־VLC ומטא־שרת מסתנכרנים לקובץ זה) (2026-04-04).
- [x] **T-034** — Vision Landing Console: החזרת שורת טאבים ו־`wireMainTabs` (פאנל מלא רק בטאב טלמטריה וסטטוסים) (2026-04-04, גרסה 1.02.31).
- [x] **T-035** — Vision Landing Console: הסרת טאבים ומסכי ״בפיתוח״ — מסך יחיד בלבד; גרסה 1.02.30 (2026-04-04).
- [x] **T-037** — Vision Landing Console המלא הועתק ל־`apps/vision-landing-console` (public + lib + server מ־VisionLandingConsole), תלויות npm, `/api/meta`, גרסה 1.02.34 (2026-04-04).
- [x] **T-007** — מימוש Desktop STEP Collector ב-Python: ממשק CustomTkinter, אוטומציית Playwright (GrabCAD ואז TraceParts), fallback ידני ל-Captcha וארגון קבצים אוטומטי (2026-03-24, גרסה 1.02.30).
- [x] **T-009** — פריסה ציבורית חינמית ומבודדת: התאמת פורט דינמי לשרת, הוספת Docker deployment עם healthcheck וכתיבת מדריך פריסה ל-Koyeb בלי לפגוע ב-local dev (2026-03-24, גרסה 1.02.43).
- [x] **T-008** — הקשחת STEP Collector להרצה אמיתית: שיפור סלקטורים, הורדה ישירה באירוע Playwright, ושיפור זרימת fallback ידני (2026-03-24, גרסה 1.02.31).
- [x] **T-018** — יישום עיצוב Aero-Lab מייצוא Stitch (ערכת צבעים, טיפוגרפיה, מסכי נחיתה/לוגים, התאמת רכיבי ליבה) (2026-03-25, v1.02.54).

- [x] **T-013** — VisionLandingConsole v1.01.18: כפתור עצור DEMO, ArduPilot READ/diff/WRITE, טאב מפה טריין (Leaflet), לוגים עם סיווג אוטומטי + רשימת כל הלוגים, אנוטציות canvas על וידאו (2026-03-25, v1.01.18).
- [x] **T-012** — VisionLandingConsole v1.01.17: SSE real-time push (/api/stream) — ביטול כל ה-polling intervals, confidence bar מ-Vision חי, DEMO/LIVE badges, SLAM/VIO UI cards, יועץ Gemini מוזרק עם מצב מערכת בזמן אמת (2026-03-25, VisionLandingConsole v1.01.17).

- [x] **T-001** — Tauri Desktop: src-tauri/tauri.conf.json + סקריפטים tauri:dev/tauri:build ב-package.json (2026-03-25, VisionLandingConsole v1.01.15).
- [x] **T-003** — ArduPilot Vision Landing config מלא (PLND, EKF, SERIAL, LOG, LAND, FS) + טבלת אימות ערכים אחרי reboot ב-UI (2026-03-25, VisionLandingConsole v1.01.15).
- [x] **T-004** — Link Health: עיכוב heartbeat + אחוז packet-loss מחושב מפעימות שנשמטו, מוצג בטאב Telemetry (2026-03-25, VisionLandingConsole v1.01.15).
- [x] **T-005** — Vision Output: /api/vision/frame POST endpoint + /api/vision/latest + כרטיסי UI ריאליים (lateral offset, heading error, confidence, frame age) + כפתור סימולציה (2026-03-25, VisionLandingConsole v1.01.15).
- [x] **T-010** — שדרוג UX ל-STEP Collector: עיצוב מתקדם יותר, לוח סטטוס ויזואלי לכל רכיב ותמונת Preview אוטומטית לכל תוצאה שנמצאה (2026-03-24, גרסה 1.02.44).
- [x] **T-011** — תיקון UX קריטי: החזרת כפתורי הפעלה גלויים תמיד + קיצור דרך Ctrl+Enter + סידור layout ברור יותר למסך Desktop STEP Collector (2026-03-24, גרסה 1.02.45).
- [x] **T-012** — שיפור UX בזמן login: סטטוס Queued/Connecting, לוגים ברורים לפני חיפוש, banner חי וטיפול ב-exceptions בלוגין כדי שלא ייראה "Pending" ללא הסבר (2026-03-24, גרסה 1.02.46).
- [x] **T-013** — תיקון סדר אירועים: עדכוני Queued/Starting browser **לפני** `sync_playwright()` כדי שלא ייתקע הממשק בזמן טעינת Chromium + הודעת שגיאה אם launch נכשל (2026-03-24, גרסה 1.02.47).
- [x] **T-014** — תיקון Playwright: הסרת `accept_downloads` מ־`chromium.launch()` (פרמטר לא חוקי; נשאר רק ב־`browser.new_context`) כדי ש-Chromium ייטען בהצלחה (2026-03-24, גרסה 1.02.48).
- [x] **T-015** — תיקון כפתורים "תקועים" בפריסת אינטרנט: רקע תפריט פריסטים מעל Plotly + Escape לסגירה (2026-03-24, גרסה 1.02.49).
- [x] **T-016** — הסרת overlays fullscreen (פריסטים + חלון גרסה) — click-outside ו-Escape בלבד; מונע חסימת כל הממשק ב-Koyeb/מגע (2026-03-24, גרסה 1.02.50).
- [x] **T-017** — ניקוי אינסטרומנטציית דיבוג מהלקוח (App + PresetManager) אחרי אישור תיקון (2026-03-24, גרסה 1.02.51).
- [x] **T-021** — STEP Collector: ארכיטקטורה מחודשת — `_incoming` עם `downloads_path`, מעקב מרובה תיקיות הורדות + ZIP→STEP, טאבי חיפוש נוספים (Google/3Dfindit), ייבוא STEP מקומי, `STEP_COLLECTOR_HEADLESS` (2026-04-04, v1.02.66).
- [x] **T-022** — STEP Collector UX: עיצוב מחודש, סרגל אינדטרמיננטי עד סיום אתחול, דילוג לוגין ללא credentials, ברירת מחדל דפדפן גלוי, אירוע `phase` לסנכרון UI (2026-04-04, v1.02.69).
- [x] **T-023** — STEP Collector: פריסה — יומן + התקדמות בשורה תחתונה (`bottom_dock`) כדי שלא ייחתכו; גובה חלון ברירת מחדל גדול יותר (2026-04-04, v1.02.72).
- [x] **T-024** — STEP Collector: תיקון חיתוך ע״י שורת משימות — `pack` (dock תחתון לפני אמצע), `_fit_window_to_screen`, לכידת `download` ל־`_incoming`, סף 0.12, timeout ידני 420s (2026-04-04, v1.02.32).
- [x] **T-026** — STEP Collector: תקיעה ב־Chromium — heartbeat כל ~15s, `launch(timeout=600s)`, ערוץ `chrome`/`msedge` דרך env, הודעות והנחיות `playwright install` (2026-04-04, v1.02.34).

## בוטלו

_(ריק)_