# בריף ל־Google Stitch — Desktop STEP Collector

**פרויקט Stitch (שלך):** https://stitch.withgoogle.com/projects/1844334306630909035 — ליישום פיקסל־פרפקט בקוד: ייצא HTML / Copy as Code מהדפדפן שלך לתיקייה ב-repo (למשל `docs/stitch-step-collector/`) כדי שהעוזר יוכל להשוות 1:1.

העתק את הסעיפים הרלוונטיים ל־Stitch (שדה ה־prompt / תיאור מסך). שפה: **עברית + אנגלית** באותו מסך.

---

## 1. מה המוצר (משפט אחד ל־Stitch)

**עברית:** אפליקציית שולחן עבודה שמארגנת קבצי CAD (STEP/STP) לפי רשימת רכיבים — עם ייבוא מקובץ מקומי, פתיחת חיפוש בדפדפן, ומעקב אחר תיקיית הורדות.

**English:** A desktop app that organizes CAD STEP/STP files per component list — local file import, open browser search, and download-folder watching.

---

## 2. קהל ומכשיר

- טכנאים / מהנדסים, Windows 10/11.
- חלון אפליקציה ~1000×750px (ניתן לשינוי גודל).
- כיוון: LTR לטקסט טכני; כותרות יכולות דו־לשוניות (HE | EN).

---

## 3. עקרונות UX (חובה ל־Stitch)

1. **המסלול שתמיד עובד** (בולט מעל הכול): כפתור **ייבוא STEP/STP מקומי** — לא מוסתר.
2. **חיפוש באינטרנט** הוא **עזר**, לא “קסם”: כפתור “פתח חיפוש בדפדפן” עם שאילתה מוכנה — בלי להבטיח הורדה אוטומטית.
3. **יומן ריצה** תמיד גלוי (לא נחתך מתחת לשורת המשימות) — אזור תחתון או מגירה קבועה.
4. **סטטוס לכל רכיב** בכרטיס: בתור / עובד / נשמר / נכשל + טקסט קצר.

---

## 4. מסכים / אזורים לעיצוב (רשימה ל־Stitch)

### A. מסך ראשי (יחיד מספיק ל־MVP)


| אזור             | תוכן                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- |
| **Header**       | כותרת: `Desktop STEP Collector` + שורת משנה דו־לשונית קצרה (מה האפליקציה עושה).               |
| **Banner סטטוס** | שורה אחת דינמית: “מוכן” / “מריץ…” / שגיאה.                                                    |
| **עמודה שמאל**   | כותרת: `רכיבים (שורה לכל חלק) / Components` — תיבת טקסט רב־שורתי גדולה.                       |
| **שורת כפתורים** | `Load .txt` · `Start` · `Stop` · `Open Folder`                                                |
| **כפתור בולט**   | `ייבוא STEP מקומי / Import local STEP` (צבע success).                                         |
| **טיפ**          | `Ctrl+Enter` מתחיל ריצה.                                                                      |
| **עמודה ימין**   | `לוח סטטוס / Status board` — רשימת כרטיסים (תמונה ממוזערת אופציונלית + שם רכיב + שורת סטטוס). |
| **תחתית**        | סרגל התקדמות + `Progress: n/m` + `יומן ריצה / Run Log` (אזור טקסט גבוה מספיק, גלילה פנימית).  |


### B. מצבים לעיצוב (variants)

- ריק (אין רכיבים).
- ריצה פעילה (סרגל אינדטרמיננטי או דטרמיננטי).
- רכיב אחד “נכשל” (אדום עדין).
- רכיב אחד “נשמר” (ירוק עדין).
- הודעת שגיאה גלובלית (toast או banner אדום).

---

## 5. עיצוב ויזואלי (קישור לפרויקט הקיים)

- **להתיישר עם Aero-Lab / Stitch בפרויקט:** ערכת צבעים וטיפוגרפיה מתוך `docs/STITCH_DESIGN_DNA.json`  
  - רקע: `#f7f9fc`  
  - primary: `#00478d`  
  - שגיאה: `#ba1a1a`  
  - כותרות: **Space Grotesk**, גוף: **Inter**
- סגנון: כלי הנדסה נקי, לא “משחקי”; הרבה לבן/אפור בהיר, כפתור ראשי כחול primary.

---

## 6. טקסטים מוכנים להדבקה (מחרוזות UI)

```
Desktop STEP Collector
אוטומציה כשאפשר · חיפוש בדפדפן · ייבוא מקומי · מעקב הורדות
Automation when possible · browser search · local import · download watch

רכיבים (שורה לכל חלק) / Components (one per line)
Load .txt  |  Start  |  Stop  |  Open Folder
ייבוא STEP מקומי / Import local STEP…
טיפ: Ctrl+Enter מתחיל ריצה · Tip: Ctrl+Enter starts run

לוח סטטוס / Status board
ממתין / Pending  |  בתור / Queued  |  בתהליך / Working  |  נשמר / Saved  |  נכשל / Failed

יומן ריצה / Run Log
Progress: 0/0
```

---

## 7. מה לבקש מ־Stitch כפלט (Deliverables)

1. **מסך אחד** רזולוציית שולחן עבודה (Desktop).
2. **Variants** למצבים לפי סעיף 4B.
3. ייצוא: **HTML + Tailwind** או **תמונות PNG** + רשימת צבעים/פונטים — כדי שנוכל להעתיק ל־CustomTkinter.

---

## 8. מה לא לעצב (כרגע)

- מסכי התחברות ל־GrabCAD (אופציונלי בעתיד).
- דפדפן מוטמע מלא בתוך המסך (אם לא מתאים ל־MVP).

---

## 9. משפט Prompt מוכן לאנגלית (אופציונלי ל־Stitch)

```
Design a desktop engineering utility window (~1040×800), light theme, primary #00478d on #f7f9fc, Space Grotesk + Inter. Left: multiline component list and primary actions including a prominent green “Import local STEP”. Right: status cards per component. Bottom: fixed run log + progress bar. Bilingual Hebrew/English labels. Include empty, running, success, and error states. No embedded browser chrome — this is a native-style desktop panel.
```

---

*קובץ זה מיועד להעתקה ל־Stitch; עדכן כאן אם משתנה ה־MVP.*