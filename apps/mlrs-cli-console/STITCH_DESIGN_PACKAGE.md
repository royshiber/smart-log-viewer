# mLRS Configurator — חבילה ל-Stitch / עיצוב מחדש

העתק את התוכן למטה ל-Stitch (או פתח את הקובץ הזה) כדי לעצב מחדש.  
**חשוב לשמר:** `id` על אלמנטים אינטראקטיביים, מחלקות לוגיקה (`data-cmd`, `data-he-action`, `data-tab`, `data-tab-panel`), והפרדת **LTR** במסך הראשי מ-**RTL** בסרגל העברי.

---

## הוראות קצרות ל-Stitch (באנגלית — להדבקה)

```
Redesign this desktop web UI for "mLRS Configurator": a two-column app inside one viewport (no body scroll).
Left/main column (LTR): fake radio bezel "device screen" — connection (Serial vs WiFi), status, warning strip, Hebrew quick-parameter card (dir=rtl inside that card only), Lua-style text menu row (Edit Tx/Rx, Save, Reload, Bind, Tools), monospace CLI log textarea, command input + Send, small tool buttons (v, pl, pl c, stats, stop stats), info grid (Tx/Rx/Power).
Right column (RTL): sidebar with tabs "Manual" / "AI assistant", manual links + short Hebrew docs, chat area (bubbles user/assistant), attach-log button, chat input, then "last action" explanation box in Hebrew.
Visual reference: EdgeTX dark + mLRS.lua orange accent (#f4af2a). Improve spacing, typography, hierarchy, and component polish while keeping all element ids and data-* attributes listed in the HTML.
Deliver: updated HTML structure + CSS (tokens/variables welcome). Optional light mode is OK if accessible.
```

---

## 1. `index.html` (מעטפת)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>mLRS Configurator (Desktop)</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

---

## 2. מבנה HTML סטטי של `#app` (כפי שמוזרק מ-`main.js`)

> במימוש האמיתי, ליד כל פקד מופיע גם `<span class="help-tip">` עם טקסט מ-`heContent.js`. לעיצוב מספיק דוגמה אחת; שאר ה-`?` זהים בעיצוב.

```html
<div class="app-layout">
  <div class="app-main-col">
    <div class="device-bezel">
      <div class="device-screen">
        <header class="lua-title-bar">
          <span class="lua-title-main">mLRS Configurator: Main Page</span>
          <span class="lua-title-ver">Lua 2026-03-20 · Desktop</span>
        </header>
        <div class="lua-body">
          <div class="conn-panel">
            <div class="conn-label-row"><span class="conn-label">Connection</span></div>
            <div class="conn-modes">
              <label class="conn-lab"><input type="radio" name="mlrs-conn" value="serial" checked /> USB Serial (Web Serial)</label>
              <label class="conn-lab"><input type="radio" name="mlrs-conn" value="wifi" /> WiFi (local WS → TCP bridge)</label>
            </div>
            <div class="tcp-fields" id="wifi-fields" style="display:none">
              <span class="tcp-label">Bridge WS URL</span>
              <div class="tcp-url-row">
                <input type="text" id="ws-url" value="ws://127.0.0.1:13765" dir="ltr" spellcheck="false" autocomplete="off" />
              </div>
            </div>
            <div class="conn-actions">
              <div class="ctl-with-help" id="serial-btn-wrap">
                <button type="button" class="tool-btn primary" id="btn-serial">Connect serial…</button>
              </div>
              <div class="ctl-with-help" id="ws-btn-wrap" style="display:none">
                <button type="button" class="tool-btn primary" id="btn-ws-connect">Connect WiFi bridge</button>
              </div>
              <div class="ctl-with-help">
                <button type="button" class="tool-btn danger" id="btn-disconnect" disabled>Disconnect</button>
              </div>
              <div class="ctl-with-help">
                <button type="button" class="tool-btn" id="btn-clear">Clear log</button>
              </div>
            </div>
            <div class="conn-label" style="margin-top:8px">Status</div>
            <div id="status" class="status-line">Disconnected</div>
          </div>
          <div class="lua-warn-row">
            <div class="lua-warn">
              After parameter changes run <strong>pstore;</strong> to save. If Mission Planner uses the same TCP link to the ESP bridge, disconnect it before this app.
            </div>
          </div>
          <div class="quick-settings" dir="rtl">
            <h3 class="quick-settings-title">שינוי פרמטר</h3>
            <p class="quick-one-line">חבר למעלה → <strong>Edit Tx/Rx</strong> → בחר פרמטר וערך → <strong>שלח שינוי</strong> → חובה <strong>Save</strong> (<code>pstore;</code>).</p>
            <div class="quick-form quick-form--compact">
              <div class="quick-field quick-field--param">
                <label class="quick-label" for="quick-param-id">פרמטר</label>
                <select id="quick-param-id" class="quick-select" aria-describedby="quick-param-hint"></select>
                <p id="quick-param-hint" class="quick-hint"></p>
              </div>
              <div class="quick-field quick-field--custom" id="wrap-quick-cli-key" style="display:none">
                <label class="quick-label" for="quick-cli-key">שם CLI</label>
                <input type="text" id="quick-cli-key" class="quick-input" dir="ltr" spellcheck="false" autocomplete="off" placeholder="tx_ser_dest" />
              </div>
              <div class="quick-field quick-field--val">
                <label class="quick-label" for="quick-param-val">ערך</label>
                <input type="text" id="quick-param-val" class="quick-input" dir="ltr" spellcheck="false" autocomplete="off" />
              </div>
              <div class="ctl-with-help quick-send-wrap">
                <button type="button" class="tool-btn primary" id="btn-quick-send">שלח</button>
              </div>
            </div>
          </div>
          <nav class="lua-menu-row" aria-label="Main actions">
            <span class="lua-menu-item"><button type="button" class="lua-menu-btn" data-cmd="pl tx;" data-he-action="editTx" disabled>Edit Tx</button></span>
            <span class="lua-menu-item"><button type="button" class="lua-menu-btn" data-cmd="pl rx;" data-he-action="editRx" disabled>Edit Rx</button></span>
            <span class="lua-menu-item"><button type="button" class="lua-menu-btn" data-cmd="pstore;" data-he-action="save" disabled>Save</button></span>
            <span class="lua-menu-item"><button type="button" class="lua-menu-btn" data-cmd="reload;" data-he-action="reload" disabled>Reload</button></span>
            <span class="lua-menu-item"><button type="button" class="lua-menu-btn" data-cmd="bind;" data-he-action="bind" disabled>Bind</button></span>
            <span class="lua-menu-item"><button type="button" class="lua-menu-btn" data-cmd="h;" data-he-action="tools" disabled>Tools</button></span>
          </nav>
          <div class="lua-log-wrap">
            <div class="lua-log-inner">
              <textarea id="log" class="lua-log" readonly aria-label="mLRS CLI log"></textarea>
            </div>
          </div>
          <div class="lua-cmd-row">
            <input type="text" id="cmd" placeholder="e.g. p tx_power = 1;" dir="ltr" spellcheck="false" autocomplete="off" />
            <div class="ctl-with-help">
              <button type="button" class="tool-btn" id="btn-send" disabled>Send</button>
            </div>
          </div>
          <div class="tool-row" id="cli-tools">
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="v;" data-he-action="v" disabled>v</button></div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="pl;" data-he-action="pl" disabled>pl</button></div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="pl c;" data-he-action="plC" disabled>pl c</button></div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="stats;" data-he-action="stats" disabled>stats</button></div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" id="btn-stop-stats" data-he-action="stopStats" disabled>stop stats</button></div>
          </div>
          <dl class="lua-info">
            <dt class="lua-info-dt"><span>Tx</span></dt><dd id="info-tx">—</dd>
            <dt class="lua-info-dt"><span>Rx</span></dt><dd id="info-rx">—</dd>
            <dt>Tx Power</dt><dd id="info-txp">—</dd>
            <dt>Rx Power</dt><dd id="info-rxp">—</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
  <aside class="he-sidebar" dir="rtl">
    <div class="he-sidebar-body">
      <div class="he-tabs" role="tablist">
        <button type="button" class="he-tab-btn active" data-tab="manual" role="tab" aria-selected="true">ספר הוראות</button>
        <button type="button" class="he-tab-btn" data-tab="chat" role="tab" aria-selected="false">עוזר mLRS (AI)</button>
      </div>
      <div class="he-tab-panel" data-tab-panel="manual" role="tabpanel">
        <div class="he-manual">
          <!-- תוכן מ-getManualHtml() — ראה סעיף 4 -->
        </div>
      </div>
      <div class="he-tab-panel he-tab-panel--chat" data-tab-panel="chat" role="tabpanel" hidden>
        <div class="chat-panel-intro">
          <span>תיעוד GitHub + לוג. שרת 3001 + GEMINI_API_KEY.</span>
        </div>
        <p id="mlrs-chat-status" class="mlrs-chat-status"></p>
        <div id="mlrs-chat-messages" class="mlrs-chat-messages" aria-live="polite"></div>
        <div class="mlrs-chat-toolbar">
          <div class="ctl-with-help">
            <button type="button" class="tool-btn" id="btn-attach-log">צרף לוג</button>
          </div>
        </div>
        <textarea id="mlrs-chat-input" class="mlrs-chat-input" rows="2" dir="rtl" placeholder="שאלה קצרה…"></textarea>
        <div class="ctl-with-help mlrs-chat-sendrow">
          <button type="button" class="tool-btn primary" id="btn-mlrs-chat-send">שלח</button>
        </div>
      </div>
    </div>
    <h2 class="he-sidebar-title he-sidebar-title--second">אחרי הפעולה האחרונה</h2>
    <div id="he-last-action" class="he-context-box">לחץ על כפתור או בחר מצב חיבור — כאן יופיע הסבר בעברית על מה שקרה.</div>
  </aside>
</div>
```

### דוגמת Tooltip (`help-tip`) — חוזר ליד פקדים

```html
<span class="help-tip" tabindex="0" aria-label="עזרה">
  <span class="help-tip-mark">?</span>
  <span class="help-tip-pop" dir="rtl">טקסט עזרה בעברית — ראה heContent.js HE_TOOLTIP</span>
</span>
```

---

## 3. רשימת `id` שחובה לשמור (הקוד תלוי בהם)

`#app`, `#wifi-fields`, `#ws-url`, `#serial-btn-wrap`, `#ws-btn-wrap`, `#btn-serial`, `#btn-ws-connect`, `#btn-disconnect`, `#btn-clear`, `#status`, `#quick-param-id`, `#quick-param-hint`, `#wrap-quick-cli-key`, `#quick-cli-key`, `#quick-param-val`, `#btn-quick-send`, `#log`, `#cmd`, `#btn-send`, `#btn-stop-stats`, `#info-tx`, `#info-rx`, `#info-txp`, `#info-rxp`, `#mlrs-chat-status`, `#mlrs-chat-messages`, `#btn-attach-log`, `#mlrs-chat-input`, `#btn-mlrs-chat-send`, `#he-last-action`

---

## 4. תוכן מדריך (`getManualHtml()` מ-`heContent.js`)

```html
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
```

---

## 5. טקסטי עזרה מלאים (`heContent.js`)

העתק מהקובץ בפרויקט: `apps/mlrs-cli-console/src/heContent.js`  
(אובייקטים `HE_TOOLTIP`, `HE_AFTER_CLICK`, ופונקציה `getManualHtml` — כבר משוכללים למעלה.)

---

## 6. פרמטרים מהירים (`mlrsParamsUi.js`)

הרשימה `MLRS_QUICK_PARAMS` ממלאת את `<select id="quick-param-id">` בזמן ריצה. תוויות בעברית:


| id              | מקש CLI         | תווית עברית (דוגמה)               |
| --------------- | --------------- | --------------------------------- |
| tx_power        | tx_power        | הספק משדר (Tx Power)              |
| rx_power        | rx_power        | הספק מקלט (Rx Power)              |
| tx_ser_dest     | tx_ser_dest     | יעד סריאל משדר (Tx Ser Dest)      |
| tx_ser_baudrate | tx_ser_baudrate | מהירות סריאל Tx (Tx Ser Baudrate) |
| bind_phrase     | bind_phrase     | ביטוי קישור (Bind Phrase)         |
| custom          | (ריק)           | שם פרמטר מותאם (מתקדם)            |


---

## 7. CSS מלא — `src/style.css`

ראה את הקובץ בפרויקט: `**apps/mlrs-cli-console/src/style.css**` (הוא המקור המלא והעדכני; ארוך מדי לשכפל כאן בשלמותו בלי כפילות).

ל-Stitch: שלח את הקובץ כמצורף או העתק את תוכנו ישירות מהריפו.

---

## 8. קבצים נוספים (לא חובה לעיצוב ויזואלי)


| קובץ              | תפקיד                                                   |
| ----------------- | ------------------------------------------------------- |
| `src/main.js`     | אירועים, חיבור Serial/WebSocket, שליחת CLI, טאבים, צ'אט |
| `src/mlrsChat.js` | קריאות ל-`/api/mlrs-chat`                               |
| `vite.config.js`  | פרוקסי `/api` → שרת                                     |


---

*נוצר לשיתוף עם Google Stitch / כלי עיצוב — המקור בקוד נשאר ב-`apps/mlrs-cli-console/`.*