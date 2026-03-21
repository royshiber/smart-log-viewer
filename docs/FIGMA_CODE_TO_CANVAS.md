# עריכת הממשק ב־Figma — מדריך מלא (Code → Canvas)

## חשוב להבין לפני שמתחילים

| מה יש אצלך לעיתים | מה נדרש ל־**Code to Canvas** (צילום מסך חי ל־Figma) |
|-------------------|-----------------------------------------------------|
| `figma-developer-mcp` עם `FIGMA_API_KEY` ב־`mcp.json` | **שרת Figma הרשמי** (Remote MCP) + **התחברות OAuth** ל־Figma |

שתי הגדרות **לא אותו דבר**:

- **`figma-developer-mcp`** — כלי קהילה; טוב לקריאת קבצים / הקשר מעיצובים דרך API.
- **שרת Figma הרשמי** (`https://mcp.figma.com/mcp`) — זה מה שמאפשר, בין השאר, **לצלם UI חי** ולשלוח ל־Figma Design, לפי [Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/).

אם רק אחד מהם מותקן, ייתכן שלא יופיע כלי “צילום ל־Figma”. אז חובה להתקין את **השרת הרשמי** לפי הסעיף הבא.

---

## שלב 1 — התקנת שרת Figma הרשמי ב־Cursor (מומלץ)

לפי [Remote server installation → Cursor](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/):

### אופן א׳ (מומלץ): תוסף Figma ב־Cursor

1. פתח **צ׳אט Agent** ב־Cursor.
2. הקלד בדיוק:
   ```text
   /add-plugin figma
   ```
3. אשר התקנה והשלם **אימות (OAuth)** ל־Figma כשמבקשים (התחברות לחשבון Figma והרשאות).

### אופן ב׳: קישור עמוק (Deep link) להתקנת MCP

1. בצ׳אט Agent, עקוב אחרי ההוראות ב־[התיעוד](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/) תחת **Cursor → Manual setup**.
2. לחץ על **Connect** ליד Figma, **Install** תחת "Install MCP Server", ואשר את פתיחת ההגדרות ב־Cursor.
3. השלם **אימות** ל־Figma.

### איך לוודא שזה עובד

1. **Cursor → Settings** (או `Ctrl+,`).
2. חפש **MCP** או **Model Context Protocol**.
3. אמור להופיע שרת **Figma** (הרשמי) במצב **מחובר / ירוק** — לא רק `figma-developer-mcp`.

קטלוג נתמכים: [Figma MCP Catalog](https://www.figma.com/mcp-catalog/).

---

## שלב 2 — להריץ את האפליקציה שלך מקומית

1. פתח טרמינל בפרויקט:
   ```bash
   cd client
   npm run dev
   ```
2. בטרמינל יופיע כתובת, למשל: `http://localhost:5173`.
3. פתח את הכתובת בדפדפן (Chrome / Edge) — **הממשק חייב להיות פתוח** בזמן הצילום.

---

## שלב 3 — לבקש מ־Cursor לצלם ל־Figma

1. פתח **Agent** (לא רק Ask), כדי שהסוכן יוכל להריץ כלים MCP.
2. ודא שהשרת **Figma הרשמי** פעיל (שלב 1).
3. הדבק באנגלית (מומלץ, לפי התיעוד):

   ```text
   My app is already running at http://localhost:5173. Use the Figma MCP code-to-canvas tool to capture the UI and send it to a new Figma Design file. Walk me through any browser or auth steps.
   ```

   או קצר יותר:

   ```text
   Capture the running app UI at http://localhost:5173 to a new Figma file using Figma code-to-canvas.
   ```

4. Cursor אמור:
   - לפתוח חלון דפדפן או לתת קישור,
   - להציג **סרגל כלים לצילום** (למשל *Entire screen* / *Select element*),
   - בסוף — קישור **Open file** לקובץ Figma.

אם הסוכן לא מזהה כלי — כתוב לו במפורש: *"Use the Figma official MCP server tools for code-to-canvas, not only file context."*

---

## שלב 4 — אחרי שהפריים ב־Figma

- ערוך שכבות, טקסטים, הערות כמו בכל קובץ Figma.
- לחזור לקוד: שלח לסוכן ב־Cursor קישור לפריים ב־Figma ובקש לממש שינוי ב־React/CSS.

---

## בעיות נפוצות

| בעיה | מה לעשות |
|------|----------|
| אין כלי “capture” / “code to canvas” | התקן את **שרת Figma הרשמי** (שלב 1). `figma-developer-mcp` לבד לא תמיד מספיק. |
| MCP אדום / לא מחובר | Settings → MCP → נסה **Authenticate** מחדש ל־Figma. |
| הדפדפן לא נפתח | הרץ ידנית `http://localhost:5173` והזכר לסוכן שהאפליקציה רצה. |
| שגיאת הרשאות ב־Figma | ודא שיש מקום ב־Drafts / הרשאת עריכה לקובץ קיים אם ביקשת קובץ ספציפי. |

---

## קישורים רשמיים

- [Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)
- [התקנת Remote MCP — כולל Cursor](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [כלים והנחיות](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)

---

## הערה לפרויקט `תוכנת לוגים`

ניתן להשאיר **גם** `figma-developer-mcp` ו**גם** את שרת Figma הרשמי — עם שמות שונים ב־`mcp.json`, כל עוד Cursor תומך בשניהם. ל־**צילום UI חי** נדרש השרת הרשמי עם OAuth.
