# אפיון מפורט — תוכנת לוגים חכמה (Smart Log Viewer)

**גרסה:** 1.0  
**תאריך:** מרץ 2025  
**סטטוס:** מסמך אפיון — מצב נוכחי + תוכנית עתידית

---

## 1. סקירה כללית

### 1.1 מטרת המוצר

תוכנת ווב לצפייה וניתוח לוגי טיסה של ArduPilot (Plane, Copter, Rover). התוכנה מאפשרת:
- טעינת קבצי BIN (Dataflash/MAVLink)
- הצגת נתונים בגרפים אינטראקטיביים
- הצגת מסלול הטיסה על מפה
- שיחה בשפה טבעית (עברית/אנגלית) עם AI לצורך ניתוח ובקשות

### 1.2 קהל יעד

- מפעילי רחפנים/מטוסים אוטונומיים
- מנתחי טיסות
- מפתחי ArduPilot
- משתמשים הדורשים ממשק בעברית

### 1.3 טכנולוגיות ליבה

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Plotly.js, Leaflet |
| Backend | Node.js, Express |
| AI | Google Gemini API |
| Parsing | JsDataflashParser (Web Worker) |

---

## 2. פיצ'רים קיימים (מצב נוכחי)

### 2.1 טעינת קבצים

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| גרירה ושחרור | Drag & drop של קובץ BIN | ✅ |
| בחירה מקובץ | כפתור "קובץ חדש" → file picker | ✅ |
| התקדמות פרסור | Progress bar בזמן טעינה | ✅ |
| Web Worker | פרסור ברקע ללא חסימת UI | ✅ |

### 2.2 גרף (Chart)

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| גרף זמן | Plotly time-series עבור שדות נבחרים | ✅ |
| בחירת שדות | Sidebar כיווצי (collapsed) — עבודה בעיקר דרך RequestBar | ✅ |
| בקשות בשפה טבעית | RequestBar: "הצג Roll ו-Pitch באדום וכחול" | ✅ |
| מצב הוספה | "הוסף", "גם" — מוסיף לגרף הקיים | ✅ |
| תוויות עברית | שמות שדות מתורגמים (fieldLabels) | ✅ |
| ייצוא PNG | כפתור ייצוא תמונה | ✅ |
| קו זמן נבחר | קו אנכי על הנקודה הנבחרת | ✅ |
| קליק ימני → מפה | "הצג במפה" מסנכרן את המפה לזמן הנבחר | ✅ |

### 2.3 מפה (Map)

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| מסלול טיסה | Polyline על Leaflet/OpenStreetMap | ✅ |
| צביעה אחידה | צבע אחד לכל המסלול | ✅ |
| צביעה לפי סף | מעל/מתחת לערך (למשל גובה 100m) | ✅ |
| צביעה לפי שדה | חיובי/שלילי/אפס | ✅ |
| צביעה גמישה | `setSegmentColors` — צבע לכל קטע לפי לוגיקה מותאמת | ✅ |
| סמנים | הוספה/ניקוי של pins על המפה | ✅ |
| זום ומרכז | setCenter, setZoom, fitBounds | ✅ |
| קליק ימני על מסלול | "סמן בגרף" — מעבר לגרף עם זמן נבחר | ✅ |
| סנכרון גרף–מפה | רק דרך קליק ימני (לא קליק רגיל) | ✅ |

### 2.4 צ'אט — גרף (Chart Chat)

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| ניתוח עם Gemini | כפתור "ניתוח עם Gemini" פותח צ'אט צד | ✅ |
| סטרימינג | תשובות מוצגות token-by-token (SSE) | ✅ |
| הקשר נתונים | buildChatContext: שדות, סטטיסטיקות, דגימה | ✅ |
| עברית/אנגלית | תשובות באותה שפה כמו השאלה | ✅ |

### 2.5 צ'אט — מפה (Map Chat)

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| צ'אט מאוחד | שיחה אחת למפה — ניתוח + שליטה | ✅ |
| יצירת קוד JS | Gemini כותב קוד שמריץ `api.*` | ✅ |
| אובייקט api מוגבל | setColor, colorByThreshold, colorByField, setSegmentColors, addMarker, clearMarkers, setCenter, setZoom, fitBounds, resetColor | ✅ |
| אובייקט data | getValues(field), fieldNames, segmentCount — גישה לנתוני טיסה | ✅ |
| הרצה מבודדת | `new Function('api','data',code)` — ללא גישה ל-window/document | ✅ |
| מצב מפה נוכחי | currentMapState נשלח לשרת — "תחליף צהוב בורוד" עובד | ✅ |
| שמירת פקודות | כפתור "שמור פקודה" — localStorage | ✅ |
| פקודות שמורות | נשלחות לשרת — Gemini משתמש בהן לבקשות דומות | ✅ |
| הנחיות חזקות | "לעולם אל תגיד לא יכול" — פרומפט מחמיר | ✅ |

### 2.6 שפה ותרגום

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| עברית / English | מתג שפה בכותרת | ✅ |
| RTL | כיוון טקסט אוטומטי | ✅ |
| תרגום רכיבים | react-i18next | ✅ |

### 2.7 טיסנים ולוגים

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| בחירת טיסן | בחירה מרשימה או "טיסן חדש +" | ✅ |
| שמירת לוגים | IndexedDB — לוגים לפי טיסן | ✅ |
| רשימת לוגים | גישה ללוגים של הטיסן הנבחר | ✅ |
| שם לוג אוטומטי | {טיסן}_{עיר}_{תאריך} | ✅ |
| Reverse geocoding | Nominatim — העיר הכי קרובה | ✅ |

### 2.8 פריסטים

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| פריסטים לגרף | שדות + צבעים — שמירה/טעינה | ✅ |
| פריסטים למפה | pathColorConfig — שמירה/טעינה | ✅ |
| הפריסטים שלי | dropdown לבחירה | ✅ |
| שמור / שמור בשם | עם שם מותאם | ✅ |

### 2.9 גרסה ומידע

| פיצ'ר | תיאור | סטטוס |
|-------|--------|-------|
| מספר גרסה | קליק על vX.XX בכותרת | ✅ |
| "מה חדש" | פופאפ עם סיכום שינויים | ✅ |
| z-index גבוה | פופאפ מעל המפה | ✅ |

---

## 3. ארכיטקטורה טכנית

### 3.1 מבנה הפרויקט

```
תוכנת לוגים/
├── client/                 # React + Vite
│   ├── src/
│   │   ├── api/            # chat.js — קריאות API
│   │   ├── components/     # DropZone, ChartPanel, MapPanel, MapChatPanel, ChatPanel, RequestBar, FieldsSidebar
│   │   ├── hooks/          # useBinParser, useFlightPath, usePathWithField
│   │   ├── i18n/           # תרגומים he/en
│   │   ├── parser/         # JsDataflashParser
│   │   ├── parsers/        # binParser.worker.js
│   │   └── utils/          # parseGraphRequest, fieldLabels, mapCommands
│   └── vite.config.js      # proxy /api → :3001
├── server/
│   ├── index.js            # Express, כל ה-endpoints
│   ├── tools/              # mapTools.js, registry.js (לא בשימוש פעיל — הוחלף ב-code gen)
│   └── .env                # GEMINI_API_KEY, GEMINI_MODEL
├── shared/                 # קבועים (לא בשימוש נרחב)
└── package.json
```

### 3.2 זרימת נתונים

```
[BIN file] → Web Worker (DataflashParser) → messages[] → getTimeSeries()
                                                              ↓
[Chart] ← selectedFields, fieldColors ← parseGraphRequest / FieldsSidebar
[Map]  ← flightPath (Lat/Lng), pathWithValues (field per segment)
[Chat] ← buildChatContext, sendUnifiedChatMessage → Gemini → { text, code, intent }
```

### 3.3 API Endpoints

| Method | Endpoint | תיאור |
|--------|----------|-------|
| GET | /api/health | בדיקת תקינות |
| POST | /api/chat/stream | צ'אט גרף — SSE streaming |
| POST | /api/chat | צ'אט גרף — לא streaming (legacy) |
| POST | /api/unified-chat | צ'אט מפה — מחזיר { text, code, intent } |
| POST | /api/parse-graph-request | פרסור בקשות גרף (לא בשימוש — פרסור מקומי) |

---

## 4. מודל נתונים

### 4.1 מבנה לוג BIN

- **Message types:** ATT, GPS, CTUN, BARO, IMU, BATT, וכו'
- **Fields:** MessageType.FieldName (למשל GPS.NSats, ATT.Yaw)
- **Time series:** מערך [time, value] לכל שדה

### 4.2 pathColorConfig

```js
// אחד מהמצבים:
{ solidColor: '#hex' }
{ field, threshold, aboveColor, belowColor }
{ field, positiveColor, negativeColor, zeroColor }
{ segmentColors: ['#hex', '#hex', ...] }  // אורך = מספר קטעים
null  // ברירת מחדל כחול
```

### 4.3 savedCommands (localStorage)

```js
[
  { id, intent: "Color path above altitude threshold", code: "api.colorByThreshold(...)", savedAt }
]
```

---

## 5. פיצ'רים רצויים — טרם הושלמו

### 5.1 בעיות ידועות

| נושא | תיאור | סטטוס |
|------|--------|-------|
| Gemini "עצלן" | לפעמים אומר "לא יכול" למרות שיש יכולת | 🔄 הוחלש עם הנחיות חזקות — יש לעקוב |
| Parser TODO | parser.js שורה 341 — regex ל-char arrays (n,N,Z) | ⏳ פתוח |
| קוד יתום | executeMapCommands, sendMapChatMessage, GraphRequestInput, FieldSelector, PRESETS | ⏳ ניקוי מומלץ |

### 5.2 פיצ'רים עתידיים (רשימת משאלות)

| פיצ'ר | תיאור | עדיפות |
|-------|--------|---------|
| Undo/Redo למפה | ביטול פקודות צביעה/סמנים אחרונות | בינונית |
| Presets לגרף | כפתורים מוכנים (יציבות, גובה, GPS) | נמוכה |
| דחיסת הקשר | שליחת רק נתונים רלוונטיים ל-Gemini ללוגים גדולים | בינונית |
| ייצוא מסלול | קובץ GPX/KML | נמוכה |
| השוואת טיסות | טעינת שני לוגים והשוואה | נמוכה |
| תמיכה ב-ULog | בנוסף ל-BIN | נמוכה |

---

## 6. דרישות לא-פונקציונליות

| דרישה | מצב |
|-------|-----|
| Node.js 18+ | דרוש |
| דפדפן מודרני | Chrome, Firefox, Edge |
| GEMINI_API_KEY | נדרש לצ'אט (אופציונלי לשאר) |
| גודל קובץ | אין הגבלה קשיחה — פרסור ברקע |
| תמיכה ב-RTL | עברית |

---

## 7. היסטוריית גרסאות (סיכום)

| גרסה | שינויים עיקריים |
|------|------------------|
| 1.01.10 | צ'אט סטרימינג, JSON מובטח, Tool Registry |
| 1.01.11 | צביעה לפי סף גובה, צבעים עברית/אנגלית |
| 1.01.12 | Code generation — Gemini כותב JS |
| 1.01.13 | שמירת פקודות מוצלחות |
| 1.01.14 | data.getValues, setSegmentColors — גמישות מלאה |

---

## 8. מסמכים נלווים

- `README.md` — התקנה והרצה
- `מדריך-API-Key.md` — הגדרת מפתח Gemini
- `הגדר-API-Key.bat` / `.ps1` — סקריפטים להגדרה
