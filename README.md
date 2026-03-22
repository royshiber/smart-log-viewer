# Smart Log Viewer – ArduPilot

תוכנת ווב חכמה לצפייה וניתוח לוגי ArduPilot (Plane, Copter, Rover). תומכת בעברית ואנגלית.

![Smart Log Viewer](https://img.shields.io/badge/ArduPilot-BIN%20Logs-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![License](https://img.shields.io/badge/License-MIT-green)

## תכונות

- **טעינת קבצי BIN** – גרירה או בחירה
- **גרפים אינטראקטיביים** – Plotly עם ייצוא PNG
- **בקשות בשפה טבעית** – עברית ואנגלית (למשל: "הצג גלגול ועלרוד", "הוסף מהירות GPS")
- **צ'אט עם Gemini** – שאלות על הנתונים וניתוח
- **תוויות בעברית** – שמות שדות בגרף
- **מצב הוספה** – "גם", "הוסף" מוסיפים לגרף הקיים

## התקנה

```bash
# התקנת תלויות
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

## הרצה

### 1. הגדרת API Key (אופציונלי – לצ'אט)

צור קובץ `server/.env`:

```
GEMINI_API_KEY=your_google_api_key
```

או השתמש ב־`GOOGLE_API_KEY`.

### 2. הפעלת השרת והקליינט

```bash
npm run dev
```

- **ממשק:** http://localhost:5173  
- **API:** http://localhost:3001  

### 3. Production

```bash
npm run build
npm start
```

פתח http://localhost:3001

## קישור לחבר (אינטרנט)

אין כתובת ציבורית אוטומטית מהמחשב המקומי. כדי לקבל קישור שחבר ברשת אחרת יפתח — פרוס ל-[Render](https://render.com) (חינמי).  
מדריך צעד־אחר־צעד: **[docs/פריסה-קישור-לחבר.md](docs/פריסה-קישור-לחבר.md)**  
בשורש הריפו קיים `render.yaml` לפריסה מהירה.

## מבנה הפרויקט

```
├── client/                 # React + Vite
│   ├── src/
│   │   ├── api/           # קריאות API
│   │   ├── components/    # רכיבי UI
│   │   ├── hooks/        # React hooks
│   │   ├── i18n/         # תרגומים
│   │   ├── parser/       # JsDataflashParser
│   │   ├── parsers/      # Web Worker
│   │   └── utils/        # parseGraphRequest, fieldLabels
│   └── ...
├── server/                 # Express + Gemini
│   ├── index.js
│   └── .env
├── shared/                 # קבועים משותפים
└── package.json
```

## דוגמאות בקשות

| בקשה | תוצאה |
|------|-------|
| הצג גלגול ועלרוד | Roll + Pitch |
| הוסף מהירות GPS | מוסיף GPS.Spd |
| גם כמות לווינים | מוסיף GPS.NSats |
| הצג גובה באדום | BARO.Alt בצבע אדום |

## דרישות

- Node.js 18+
- דפדפן מודרני

## רישיון

MIT
