/** App version - increment on each change */
export const APP_VERSION = '1.02.15';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. תיקוני שימושיות המשך: טבלת לוגים מאוחדת גם לכטב"מים מושווים + כרטיסי השוואה ברורים יותר
2. Gemini: סטטוס חיבור אמין יותר, תשובות ממוקדות יותר, ורמזי זמן אבסולוטי בהקשר (HH:MM:SS)
3. שיפור דיוק הוראות צבע במפה לפי ערכים/טווחים מדויקים
4. העלאת BIN מרובה: אפשר לבחור כמה קבצים במכה (דרופ/דפדוף) עם תור עיבוד יציב
5. אחידות מונחים: הוחלף "טיסן" ל-"כטב״ם" בכלל הממשק
6. מסכי פתיחה/בחירה: פונט כפתורי הבחירה הותאם לכותרת, וחץ חזרה מוגדל ויציב יותר
7. רשימת לוגים: נוסף כפתור עין ליד מחיקה להצגה/הסתרה של לוג כשכבת השוואה
8. ריסייז עמודות: טווחי רוחב תוקנו כך שהסליידרים משקפים רוחב בפועל (לוגים + Gemini panel)
9. Gemini ממוקד יותר: פורמט תשובה צפוי וקצר כברירת מחדל, עם שורת ביטחון וסיבה
10. סטטוס Gemini חי: נקודה ירוקה/אדומה עם tooltip סיבה דרך בדיקת חיבור שרתית`,
  en: `1. Follow-up usability fixes: unified log table for compared UAVs + clearer comparison cards
2. Gemini: more reliable status indicator, tighter response format, and absolute-time hints in context (HH:MM:SS)
3. Improved map-color command accuracy for exact thresholds/ranges
4. Multi-BIN upload: select several files at once (drop/browse) with a stable processing queue
5. Terminology consistency: replaced “airplane” wording with UAV terminology across the UI
6. Landing/picker polish: action-button typography aligned with the app title, bigger and more stable back arrow
7. Log list: added an eye button next to delete to show/hide a log as a comparison overlay
8. Column resizing fixes: sliders now map to real visible width ranges (logs + Gemini panel)
9. More focused Gemini answers: predictable concise structure by default, with confidence line and reason
10. Live Gemini status: green/red indicator with hover reason via server-side connectivity check`,
};
