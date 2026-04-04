/**
 * Why: Hebrew help text aligned with olliw42/mLRS-docu (CLI, WIRELESS_BRIDGE, MATEKSYS, LUA) and lua/mLRS.lua behaviour names.
 * What: Static strings for tooltips, post-click panel, and the sidebar manual HTML.
 */

/** @type {Record<string, string>} Tooltip (hover) — short */
export const HE_TOOLTIP = {
  modeSerial:
    'חיבור ישיר ל-COM דרך Web Serial (Chrome/Edge), 115200 8N1 כמו ב-CLI.md. מתאים כשהמודול או מתאם USB-UART מזוהה במחשב.',
  modeWifi:
    'נתיב WiFi: גשר ESP שקוף (mlrs-wireless-bridge) מפנה TCP (ברירת מחדל 5760) לסריאל 115200. הדפדפן מתחבר ל-WebSocket מקומי שמפנה ל-TCP.',
  wsUrl:
    'כתובת שרת ה-WebSocket המקומי (ברירת מחדל ws://127.0.0.1:13765). מריצים: npm run bridge בתיקיית האפליקציה או start-mlrs-configurator.bat.',
  btnSerial:
    'בוחר יציאת COM ופותח סשן סריאלי. תואם למפרט CLI הרשמי: סיום פקודות ב-; ו-CRLF.',
  btnWs:
    'מתחבר לגשר המקומי. ודא שהגשר מצביע ל-IP של נקודת הגישה של ה-ESP (למשל 192.168.4.55) ופורט TCP כמו ב-WIRELESS_BRIDGE.md.',
  btnDisconnect: 'סוגר את חיבור הסריאל או ה-WebSocket ומשחרר את הממשק.',
  btnClear: 'מנקה את תוכן חלון הלוג בלבד (לא שולח פקודות למודול).',
  editTx:
    'שולח pl tx; — רשימת פרמטרי משדר (Tx) כמו בעמוד Edit Tx בסקריפט ה-Lua. דורש חיבור פעיל ל-Tx.',
  editRx:
    'שולח pl rx; — פרמטרי מקלט כשיש לינק. כמו Edit Rx ב-Lua.',
  save:
    'שולח pstore; — שמירת פרמטרים בזיכרון קבוע (חובה אחרי שינוי, אחרת אובד בהפסקת חשמל). מתועד ב-CLI.md.',
  reload:
    'שולח reload; — טעינה מחדש של ערכי פרמטרים מהזיכרון.',
  bind:
    'שולח bind; — מצב קישור: ה-Tx נכנס ל-bind; על ה-Rx יש ללחוץ כפתור bind לפי התיעוד (BINDING.md).',
  tools:
    'שולח h; — רשימת פקודות CLI זמינות (עזרה קצרה), מקביל לכלים/מסכי עזר ב-Lua.',
  send:
    'שולח את השורה בשדה (מוסיף ; אם חסר) עם CRLF. פורמט: p שם_פרמטר = ערך; לפי CLI.md.',
  cmdInput: 'הקלד פקודת CLI מלאה. רווחים בשם פרמטר מוחלפים ב-underscore, למשל p tx_power = 1;',
  v: 'שולח v; — גרסת קושחה ושם מכשיר ל-Tx ול-Rx אם מחובר.',
  pl: 'שולח pl; — כל הפרמטרים (Tx+Rx).',
  plC: 'שולח pl c; — פרמטרים משותפים ל-Tx ו-Rx.',
  stats: 'שולח stats; — סטטיסטיקות בזרם רציף. עצירה: כל תו (כאן כפתור stop stats שולח רווח גולמי).',
  stopStats:
    'שולח תו גולמי (רווח) כדי לעצור את זרם stats; לפי CLI.md.',
  warnBox:
    'אחרי כל שינוי פרמטרים יש להריץ pstore; לפני כיבוי. אם Mission Planner מחובר לאותו TCP ל-ESP, נתק אותו — לעיתים רק לקוח TCP אחד.',
  infoTx: 'שדות מידע תחתונים: בגרסה זו מציגים מציין מקום; ניתן למלא מפלט v; בעתיד.',
  infoRx: 'מצב מקלט — יתעדכן כשיהיה פארס לפלט המכשיר.',
  quickParamSelect:
    'בחר פרמטר מהרשימה — שם ה-CLI (עם קו תחתון) תואם לפלט של pl tx; / PARAMETERS.md. "מותאם" מאפשר להקליד שם מדויק.',
  quickParamValue:
    'הערך החדש: מספר, מילה או אינדקס כפי שמופיעים בסוגריים בפלט pl. בלי נקודה-פסיק — הממשק מוסיף אוטומטית בפקודה.',
  btnQuickSend:
    'שולח למודול: p שם = ערך; (לפי CLI.md). אחרי זה חובה Save / pstore; לשמירה בבזק.',
  chatPanel:
    'עוזר מבוסס Gemini עם תמצית תיעוד mLRS מ-GitHub. דורש הרצת שרת הפרויקט (פורט 3001) ו-GEMINI_API_KEY ב-server/.env. הלוג האחרון נשלח אוטומטית כהקשר.',
  btnAttachLog: 'מוסיף את סוף לוג ה-CLI להודעת המשתמש הבאה (לשאלות על מצב נוכחי).',
  btnChatSend: 'שולח את השאלה לשרת; התשובה מסתמכת על בסיס הידע + הלוג שסיפקת.',
};

/** @type {Record<string, string>} הסבר מפורט אחרי לחיצה */
export const HE_AFTER_CLICK = {
  modeSerial: 'בחרת חיבור USB Serial. בשלב הבא לחץ "Connect serial" ובחר את ה-COM המתאים (115200).',
  modeWifi: 'בחרת חיבור דרך גשר WiFi. ודא ש-tcp-ws-bridge רץ ושכתובת ה-WS נכונה, ואז לחץ Connect WiFi bridge.',
  btnSerial: 'נפתח דיאלוג בחירת יציאה. אחרי אישור תתחבר ב-115200 ותוכל לשלוח פקודות CLI.',
  btnWs: 'מתחבר ל-WebSocket המקומי שמפנה ל-TCP של הגשר. אם נכשל — בדוק שהגשר רץ וש-IP/פורט נכונים (WIRELESS_BRIDGE.md).',
  btnDisconnect: 'החיבור נסגר. אפשר לשנות מצב Serial/WiFi או לפתוח מחדש.',
  btnClear: 'הלוג במסך נוקה. המודול לא הושפע.',
  editTx: 'נשלחה pl tx; — בחלון הלוג אמורה להופיע רשימת פרמטרי ה-Tx כפי שהמכשיר מחזיר.',
  editRx: 'נשלחה pl rx; — פרמטרי ה-Rx מוצגים אם יש לינק למקלט.',
  save: 'נשלחה pstore; — אם הצליח, הפרמטרים נשמרו בבזק. הרבה פרמטרים דורשים גם מחזור חשמל לפי התיעוד.',
  reload: 'נשלחה reload; — הערכים נטענים מחדש מהזיכרון.',
  bind: 'נשלחה bind; — ה-Tx במצב קישור. על ה-Rx לפעול לפי BINDING.md (כפתור bind).',
  tools: 'נשלחה h; — רשימת פקודות תופיע בלוג.',
  send: 'הפקודה מהשדה נשלחה למודול. בדוק תשובה בלוג.',
  v: 'נשלחה v; — גרסאות ושמות מכשירים יופיעו בלוג.',
  pl: 'נשלחה pl; — רשימה ארוכה של כל הפרמטרים.',
  plC: 'נשלחה pl c; — פרמטרים משותפים ל-Tx ו-Rx בלבד (פקודת pl c; ב-CLI.md).',
  stats: 'נשלחה stats; — סטטיסטיקות בזרם. לעצירה לחץ stop stats.',
  stopStats: 'נשלח תו לעצירת stats.',
  btnQuickSend:
    'נשלחה פקודת p … = …; לעדכון פרמטר. בדוק בלוג שהמכשיר קיבל. אל תשכח pstore; כדי לשמור!',
  chatSent: 'השאלה נשלחה לעוזר. התשובה מבוססת על תיעוד mLRS ב-GitHub ועל הלוג שסיפקת.',
};

/**
 * Why: Manual text without internal scrolling (single viewport layout).
 * What: Returns compact inner HTML with upstream links and one-line protocol hints (trusted, static only).
 */
export function getManualHtml() {
  return `
<div class="he-manual-compact">
  <p class="he-manual-links">
    <a href="https://github.com/olliw42/mLRS-docu/blob/master/docs/CLI.md" target="_blank" rel="noreferrer">CLI</a> ·
    <a href="https://github.com/olliw42/mLRS/blob/master/lua/mLRS.lua" target="_blank" rel="noreferrer">mLRS.lua</a> ·
    <a href="https://github.com/olliw42/mLRS-docu/blob/master/docs/WIRELESS_BRIDGE.md" target="_blank" rel="noreferrer">WiFi bridge</a> ·
    <a href="https://github.com/olliw42/mLRS-docu/blob/master/docs/MATEKSYS.md" target="_blank" rel="noreferrer">Matek</a> ·
    <a href="https://github.com/olliw42/mLRS-docu/blob/master/docs/PARAMETERS.md" target="_blank" rel="noreferrer">PARAMETERS</a> ·
    <a href="https://github.com/olliw42/mLRS-docu/blob/master/docs/BINDING.md" target="_blank" rel="noreferrer">BINDING</a>
  </p>
  <p class="he-manual-one"><strong>CLI</strong> כמו ב-Lua: פקודות עם <code>;</code> · <strong>115200 8N1</strong> · CRLF. WiFi: גשר <code>mlrs-wireless-bridge</code> → TCP (למשל 5760), דפדפן דרך <code>tcp-ws-bridge</code>.</p>
  <p class="he-manual-one"><strong>תפריט:</strong> <code>pl tx;</code> / <code>pl rx;</code> · <code>pstore;</code> · <code>reload;</code> · <code>bind;</code> · <code>h;</code> · למטה: <code>v;</code> <code>pl;</code> <code>pl c;</code> <code>stats;</code>. פרמטר: <code>p שם = ערך;</code> (קו תחתון) + <code>pstore;</code>.</p>
  <p class="he-manual-one">צריבה: <a href="https://olliw.eu/mlrsflasher" target="_blank" rel="noreferrer">mLRS Web Flasher</a> (לא מסך זה).</p>
</div>
`;
}
