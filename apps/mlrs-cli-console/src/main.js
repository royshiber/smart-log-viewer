/**
 * mLRS Configurator (desktop) — CLI over Web Serial or local TCP→WebSocket bridge.
 * Why: Matek mR900-30-TX users connect via USB-C (DFU/flashing per docs), HC-04 BT, or ESP wireless bridge (WiFi TCP/UDP); this UI matches olliw42/mLRS lua/mLRS.lua layout where possible.
 * What: 115200 8N1 byte stream, CLI lines end with `;`; bridge defaults follow mLRS-docu WIRELESS_BRIDGE.md (192.168.4.55:5760).
 */

import { HE_TOOLTIP, HE_AFTER_CLICK, getManualHtml } from './heContent.js';
import { MLRS_QUICK_PARAMS, sanitizeParamValue } from './mlrsParamsUi.js';
import { sendMlrsChat, fetchGeminiStatus } from './mlrsChat.js';

const MLRS_BAUD = 115200;
const DEFAULT_WS_URL = 'ws://127.0.0.1:13765';
const LUA_SCRIPT_REF = '2026-03-20';

/** @type {'none' | 'serial' | 'websocket'} */
let transportKind = 'none';
let serialPort = null;
let readAbort = null;
/** @type {Promise<void> | null} */
let readTask = null;
/** @type {ReadableStreamDefaultReader<Uint8Array> | null} */
let lineReader = null;
/** @type {WebSocket | null} */
let wsConn = null;
/** @type {Promise<void>} */
let writeChain = Promise.resolve();

/**
 * Why: Avoid XSS if strings in heContent.js ever include special characters.
 * What: Escapes HTML entities for tooltip inner HTML.
 * @param {string} s
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/**
 * Why: Consistent “?” control next to each action; hover/focus shows Hebrew from HE_TOOLTIP.
 * What: Returns HTML for a small circular help control.
 * @param {string} key
 */
function helpQ(key) {
  const tip = HE_TOOLTIP[key];
  if (!tip) return '';
  return `<span class="help-tip" tabindex="0" aria-label="עזרה"><span class="help-tip-mark">?</span><span class="help-tip-pop" dir="rtl">${escapeHtml(tip)}</span></span>`;
}

/**
 * Why: Chromium exposes hardware serial; same framing as mLRS CLI.md.
 * What: True if `navigator.serial` exists.
 */
function isWebSerialSupported() {
  return typeof navigator !== 'undefined' && !!navigator.serial;
}

/**
 * Why: Unified guard for send path across Serial and WebSocket transports.
 * What: True when the active transport can accept outbound bytes.
 */
function isTransportWritable() {
  if (transportKind === 'serial') return !!(serialPort?.writable);
  if (transportKind === 'websocket') return wsConn?.readyState === WebSocket.OPEN;
  return false;
}

/** Max lines kept in the CLI log textarea so the fixed-height panel never needs scrolling. */
const MLRS_LOG_MAX_LINES = 100;

/**
 * Why: Session log for support and copy/paste of CLI I/O.
 * What: Appends a prefixed line and trims older lines so the one-screen layout stays scroll-free.
 * @param {HTMLTextAreaElement} el
 * @param {string} text
 * @param {'rx' | 'tx' | 'sys'} [kind]
 */
function appendLog(el, text, kind = 'rx') {
  const prefix = kind === 'tx' ? '> ' : kind === 'sys' ? '# ' : '';
  const line = `${prefix}${text}`;
  el.value += (el.value && !el.value.endsWith('\n') ? '\n' : '') + line + '\n';
  const lines = el.value.split('\n');
  if (lines.length > MLRS_LOG_MAX_LINES) {
    el.value = lines.slice(-MLRS_LOG_MAX_LINES).join('\n');
  }
}

/**
 * Why: mLRS CLI accepts `;` terminator; CRLF after is safe per CLI.md.
 * What: Trims and ensures trailing `;`.
 * @param {string} raw
 */
function normalizeCliCommand(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  return t.endsWith(';') ? t : `${t};`;
}

/**
 * Why: Web Serial allows one writer; WebSocket benefits from ordered sends.
 * What: Serializes writes for the active transport.
 * @param {Uint8Array} data
 */
function enqueueWriteBytes(data) {
  writeChain = writeChain.then(async () => {
    if (transportKind === 'serial' && serialPort?.writable) {
      const writer = serialPort.writable.getWriter();
      try {
        await writer.write(data);
      } finally {
        writer.releaseLock();
      }
    } else if (transportKind === 'websocket' && wsConn?.readyState === WebSocket.OPEN) {
      wsConn.send(data);
    }
  });
  return writeChain;
}

/**
 * Why: Same read/decode path for UART chunks.
 * What: UTF-8 decodes into the log.
 * @param {HTMLTextAreaElement} logEl
 * @param {Uint8Array} chunk
 * @param {TextDecoder} decoder
 */
function decodeRxChunk(logEl, chunk, decoder) {
  if (!chunk?.byteLength) return;
  const text = decoder.decode(chunk, { stream: true });
  if (text) appendLog(logEl, text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'rx');
}

/**
 * Why: Drain Web Serial until disconnect.
 * What: Async loop with cancel support for clean `port.close()`.
 * @param {SerialPort} port
 * @param {AbortSignal} signal
 * @param {HTMLTextAreaElement} logEl
 */
async function startSerialReadLoop(port, signal, logEl) {
  lineReader = port.readable.getReader();
  const reader = lineReader;
  const decoder = new TextDecoder();
  try {
    while (!signal.aborted) {
      let value;
      let done;
      try {
        ({ value, done } = await reader.read());
      } catch (e) {
        if (signal.aborted) break;
        appendLog(logEl, String(e?.message || e), 'sys');
        break;
      }
      if (done) break;
      decodeRxChunk(logEl, value, decoder);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
    lineReader = null;
  }
}

/**
 * Why: Mirror serial cancel path for WebSocket-free teardown.
 * What: Aborts controller and cancels the stream reader.
 */
function stopSerialReadLoop() {
  if (readAbort) {
    readAbort.abort();
    readAbort = null;
  }
  void lineReader?.cancel?.().catch(() => {});
}

/**
 * Why: `stats;` ends only after any raw byte (CLI.md).
 * What: Sends 0x20 without CLI line wrapping.
 * @param {HTMLTextAreaElement} logEl
 */
async function sendStatsStopByte(logEl) {
  if (!isTransportWritable()) {
    appendLog(logEl, 'Not connected — stats stop not sent.', 'sys');
    return;
  }
  appendLog(logEl, '[raw 0x20] stop stats', 'tx');
  try {
    await enqueueWriteBytes(new Uint8Array([0x20]));
  } catch (e) {
    appendLog(logEl, `Send error: ${e?.message || e}`, 'sys');
  }
}

/**
 * Why: Release UART and UI state.
 * What: Stops reader, awaits task, closes port.
 * @param {HTMLTextAreaElement} logEl
 */
async function teardownSerial(logEl) {
  stopSerialReadLoop();
  try {
    if (readTask) await readTask;
  } catch {
    /* ignore */
  }
  readTask = null;
  try {
    if (serialPort) await serialPort.close();
  } catch (e) {
    appendLog(logEl, `Serial close: ${e?.message || e}`, 'sys');
  }
  serialPort = null;
}

/**
 * Why: Close WebSocket from UI or error handlers.
 * What: Clears handlers and reference.
 */
function teardownWebSocket() {
  if (!wsConn) return;
  wsConn.onopen = null;
  wsConn.onmessage = null;
  wsConn.onerror = null;
  wsConn.onclose = null;
  try {
    wsConn.close();
  } catch {
    /* ignore */
  }
  wsConn = null;
}

/**
 * Why: Pick COM port for direct USB-UART / USB-C VCP paths (when available).
 * What: Opens 115200 8N1 and starts read loop.
 * @param {HTMLTextAreaElement} logEl
 * @param {HTMLElement} statusEl
 * @param {ReturnType<typeof collectUiRefs>} ui
 */
async function connectSerialTransport(logEl, statusEl, ui, onHeContext) {
  onHeContext?.('btnSerial');
  if (!isWebSerialSupported()) {
    appendLog(logEl, 'Web Serial not available. Use Chrome/Edge on desktop.', 'sys');
    return;
  }
  await disconnectAll(logEl, statusEl, ui, { verbose: false });
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: MLRS_BAUD, dataBits: 8, stopBits: 1, parity: 'none' });
    transportKind = 'serial';
    readAbort = new AbortController();
    readTask = startSerialReadLoop(serialPort, readAbort.signal, logEl);
    readTask.catch(() => {});
    statusEl.textContent = `Serial · ${MLRS_BAUD} baud`;
    setConnectedUi(ui, true);
    appendLog(logEl, 'Serial connected. Try v; or pl tx;', 'sys');
  } catch (e) {
    transportKind = 'none';
    serialPort = null;
    appendLog(logEl, `Serial failed: ${e?.message || e}`, 'sys');
    statusEl.textContent = 'Disconnected';
    setConnectedUi(ui, false);
  }
}

/**
 * Why: WiFi path uses olliw42 transparent bridge at TCP 5760; local Node relays WS for the browser.
 * What: Opens binary WebSocket and appends RX via TextDecoder stream.
 * @param {HTMLTextAreaElement} logEl
 * @param {HTMLElement} statusEl
 * @param {ReturnType<typeof collectUiRefs>} ui
 * @param {string} url
 */
function connectWebSocketTransport(logEl, statusEl, ui, url, onHeContext) {
  onHeContext?.('btnWs');
  void disconnectAll(logEl, statusEl, ui, { verbose: false }).then(() => {
    let targetUrl = String(url || '').trim() || DEFAULT_WS_URL;
    const decoder = new TextDecoder();
    try {
      wsConn = new WebSocket(targetUrl);
    } catch (e) {
      appendLog(logEl, `WebSocket URL error: ${e?.message || e}`, 'sys');
      return;
    }
    wsConn.binaryType = 'arraybuffer';
    wsConn.onopen = () => {
      transportKind = 'websocket';
      statusEl.textContent = `WiFi bridge · ${targetUrl}`;
      setConnectedUi(ui, true);
      appendLog(
        logEl,
        'WebSocket open. Ensure tcp-ws-bridge targets your mLRS AP IP (default 192.168.4.55:5760). Disconnect Mission Planner if TCP is single-client.',
        'sys',
      );
    };
    wsConn.onmessage = (ev) => {
      const buf = ev.data instanceof ArrayBuffer ? new Uint8Array(ev.data) : new Uint8Array();
      decodeRxChunk(logEl, buf, decoder);
    };
    wsConn.onerror = () => {
      appendLog(logEl, 'WebSocket error (is tcp-ws-bridge running?)', 'sys');
    };
    wsConn.onclose = () => {
      if (transportKind === 'websocket') {
        transportKind = 'none';
        statusEl.textContent = 'Disconnected';
        setConnectedUi(ui, false);
        appendLog(logEl, 'WebSocket closed.', 'sys');
      }
      wsConn = null;
    };
  });
}

/**
 * Why: Single disconnect control for both transports.
 * What: Tears down serial and/or WebSocket and resets buttons.
 * @param {HTMLTextAreaElement} logEl
 * @param {HTMLElement} statusEl
 * @param {ReturnType<typeof collectUiRefs>} ui
 */
async function disconnectAll(logEl, statusEl, ui, opts = { verbose: true }) {
  const wasActive = transportKind !== 'none';
  teardownWebSocket();
  if (serialPort) await teardownSerial(logEl);
  stopSerialReadLoop();
  transportKind = 'none';
  statusEl.textContent = 'Disconnected';
  setConnectedUi(ui, false);
  if (opts.verbose && wasActive) appendLog(logEl, 'Disconnected.', 'sys');
}

/**
 * Why: Enable/disable LUA-style actions consistently.
 * What: Toggles menu + tool buttons and command input.
 * @param {ReturnType<typeof collectUiRefs>} ui
 * @param {boolean} on
 */
function setConnectedUi(ui, on) {
  ui.disconnectBtn.disabled = !on;
  ui.sendBtn.disabled = !on;
  ui.serialBtn.disabled = on;
  ui.wsBtn.disabled = on;
  for (const b of ui.menuBtns) b.disabled = !on;
  for (const b of ui.toolBtns) b.disabled = !on;
}

/**
 * Why: Send CLI lines with documented CRLF suffix.
 * What: UTF-8 encode and queue write.
 * @param {string} command
 * @param {HTMLTextAreaElement} logEl
 */
async function sendCliCommand(command, logEl) {
  if (!isTransportWritable()) {
    appendLog(logEl, 'Not connected.', 'sys');
    return;
  }
  const line = normalizeCliCommand(command);
  if (!line) return;
  const enc = new TextEncoder();
  appendLog(logEl, line, 'tx');
  try {
    await enqueueWriteBytes(enc.encode(`${line}\r\n`));
  } catch (e) {
    appendLog(logEl, `Send error: ${e?.message || e}`, 'sys');
  }
}

/**
 * Why: Read DOM refs once after mount.
 * @param {HTMLElement} root
 */
function collectUiRefs(root) {
  return {
    statusEl: /** @type {HTMLElement} */ (root.querySelector('#status')),
    logEl: /** @type {HTMLTextAreaElement} */ (root.querySelector('#log')),
    cmdInput: /** @type {HTMLInputElement} */ (root.querySelector('#cmd')),
    disconnectBtn: /** @type {HTMLButtonElement} */ (root.querySelector('#btn-disconnect')),
    sendBtn: /** @type {HTMLButtonElement} */ (root.querySelector('#btn-send')),
    menuBtns: /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll('.lua-menu-btn')]),
    toolBtns: /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll('#cli-tools .tool-btn')]),
    serialBtn: /** @type {HTMLButtonElement} */ (root.querySelector('#btn-serial')),
    wsBtn: /** @type {HTMLButtonElement} */ (root.querySelector('#btn-ws-connect')),
    wsUrlInput: /** @type {HTMLInputElement} */ (root.querySelector('#ws-url')),
  };
}

/**
 * Why: Match Google Stitch dashboard layout (3 columns + chrome) while keeping CLI behaviour.
 * What: Injects grid shell: left rail (connection + params + menu), center terminal, RTL sidebar.
 */
function mountApp() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="app-shell">
      <header class="mlrs-chrome-top">
        <div class="mlrs-chrome-brand">
          <span class="mlrs-chrome-title">mLRS CONFIGURATOR</span>
          <span class="mlrs-chrome-sub">Lua ${LUA_SCRIPT_REF} · CLI desktop</span>
        </div>
        <div class="mlrs-chrome-tabs-track" dir="ltr">
          <nav class="mlrs-chrome-tabs" aria-label="אזור עבודה (מסך זה = CLI)">
            <span class="mlrs-chrome-tab">CONFIG</span>
            <span class="mlrs-chrome-tab">FLASHING</span>
            <span class="mlrs-chrome-tab mlrs-chrome-tab--active">CLI</span>
            <span class="mlrs-chrome-tab">FILES</span>
          </nav>
        </div>
        <div class="mlrs-chrome-actions">
          <button type="button" class="mlrs-btn-connect" id="btn-chrome-connect">CONNECT</button>
          <a class="mlrs-chrome-link-ghost" href="https://olliw.eu/mlrsflasher" target="_blank" rel="noreferrer">Flasher</a>
        </div>
      </header>
      <div class="app-layout">
        <aside class="mlrs-left-rail" aria-label="Connection and actions">
          <div class="mlrs-panel">
            <div class="conn-panel">
              <div class="conn-label-row"><span class="conn-label">Connection</span></div>
              <div class="conn-modes conn-modes--pills">
                <label class="conn-pill"><input type="radio" name="mlrs-conn" value="serial" checked /><span>Serial</span></label>${helpQ('modeSerial')}
                <label class="conn-pill"><input type="radio" name="mlrs-conn" value="wifi" /><span>WiFi</span></label>${helpQ('modeWifi')}
              </div>
              <div class="tcp-fields" id="wifi-fields" style="display:none">
                <span class="tcp-label">Bridge WS URL</span>
                <div class="tcp-url-row">
                  <input type="text" id="ws-url" value="${DEFAULT_WS_URL}" dir="ltr" spellcheck="false" autocomplete="off" />
                  ${helpQ('wsUrl')}
                </div>
              </div>
              <div class="conn-actions">
                <div class="ctl-with-help" id="serial-btn-wrap">
                  <button type="button" class="tool-btn primary tool-btn--block" id="btn-serial">Connect serial…</button>${helpQ('btnSerial')}
                </div>
                <div class="ctl-with-help" id="ws-btn-wrap" style="display:none">
                  <button type="button" class="tool-btn primary tool-btn--block" id="btn-ws-connect">Connect WiFi bridge</button>${helpQ('btnWs')}
                </div>
                <div class="ctl-with-help">
                  <button type="button" class="tool-btn danger tool-btn--block" id="btn-disconnect" disabled>Disconnect</button>${helpQ('btnDisconnect')}
                </div>
                <div class="ctl-with-help">
                  <button type="button" class="tool-btn tool-btn--block" id="btn-clear">Clear log</button>${helpQ('btnClear')}
                </div>
              </div>
              <div class="conn-label conn-label--status">Status</div>
              <div id="status" class="status-line status-line--chip">Disconnected</div>
            </div>
            <div class="lua-warn-row">
              <div class="lua-warn lua-warn--stitch" role="alert">
                <strong class="lua-warn-kicker">pstore &amp; TCP</strong>
                After parameter changes run <strong>pstore;</strong> to save. If Mission Planner uses the same TCP link to the ESP bridge, disconnect it before this app.
              </div>
              ${helpQ('warnBox')}
            </div>
            <div class="quick-settings" dir="rtl">
              <h3 class="quick-settings-title">שינוי פרמטר</h3>
              <p class="quick-one-line">חבר למעלה → <strong>Edit Tx/Rx</strong> → בחר פרמטר וערך → <strong>שלח שינוי</strong> → חובה <strong>Save</strong> (<code>pstore;</code>).</p>
              <div class="quick-form quick-form--compact">
                <div class="quick-field quick-field--param">
                  <label class="quick-label" for="quick-param-id">פרמטר</label>
                  <span class="quick-field-help">${helpQ('quickParamSelect')}</span>
                  <select id="quick-param-id" class="quick-select" aria-describedby="quick-param-hint"></select>
                  <p id="quick-param-hint" class="quick-hint"></p>
                </div>
                <div class="quick-field quick-field--custom" id="wrap-quick-cli-key" style="display:none">
                  <label class="quick-label" for="quick-cli-key">שם CLI</label>
                  <input type="text" id="quick-cli-key" class="quick-input" dir="ltr" spellcheck="false" autocomplete="off" placeholder="tx_ser_dest" />
                </div>
                <div class="quick-field quick-field--val">
                  <label class="quick-label" for="quick-param-val">ערך</label>
                  <span class="quick-field-help">${helpQ('quickParamValue')}</span>
                  <input type="text" id="quick-param-val" class="quick-input" dir="ltr" spellcheck="false" autocomplete="off" />
                </div>
                <div class="ctl-with-help quick-send-wrap">
                  <button type="button" class="tool-btn primary" id="btn-quick-send">שלח</button>
                  ${helpQ('btnQuickSend')}
                </div>
              </div>
            </div>
            <nav class="lua-menu-row lua-menu-row--rail" aria-label="Main actions">
              <span class="lua-menu-item lua-menu-item--rail"><button type="button" class="lua-menu-btn" data-cmd="pl tx;" data-he-action="editTx" disabled>Edit Tx</button>${helpQ('editTx')}</span>
              <span class="lua-menu-item lua-menu-item--rail"><button type="button" class="lua-menu-btn" data-cmd="pl rx;" data-he-action="editRx" disabled>Edit Rx</button>${helpQ('editRx')}</span>
              <span class="lua-menu-item lua-menu-item--rail"><button type="button" class="lua-menu-btn" data-cmd="pstore;" data-he-action="save" disabled>Save</button>${helpQ('save')}</span>
              <span class="lua-menu-item lua-menu-item--rail"><button type="button" class="lua-menu-btn" data-cmd="reload;" data-he-action="reload" disabled>Reload</button>${helpQ('reload')}</span>
              <span class="lua-menu-item lua-menu-item--rail"><button type="button" class="lua-menu-btn" data-cmd="bind;" data-he-action="bind" disabled>Bind</button>${helpQ('bind')}</span>
              <span class="lua-menu-item lua-menu-item--rail"><button type="button" class="lua-menu-btn" data-cmd="h;" data-he-action="tools" disabled>Tools</button>${helpQ('tools')}</span>
            </nav>
          </div>
        </aside>
        <main class="mlrs-center-stage mlrs-device-bezel">
          <div class="mlrs-terminal-head"><span class="mlrs-terminal-title">CLI / LOG</span></div>
          <div class="lua-log-wrap lua-log-wrap--stitch">
            <div class="lua-log-inner">
              <textarea id="log" class="lua-log" readonly aria-label="mLRS CLI log"></textarea>
            </div>
          </div>
          <div class="lua-cmd-row">
            <input type="text" id="cmd" placeholder="e.g. p tx_power = 1;" dir="ltr" spellcheck="false" autocomplete="off" aria-describedby="cmd-help-hint" />
            ${helpQ('cmdInput')}
            <div class="ctl-with-help">
              <button type="button" class="tool-btn tool-btn--accent" id="btn-send" disabled>Send</button>${helpQ('send')}
            </div>
          </div>
          <div class="tool-row" id="cli-tools">
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="v;" data-he-action="v" disabled>v</button>${helpQ('v')}</div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="pl;" data-he-action="pl" disabled>pl</button>${helpQ('pl')}</div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="pl c;" data-he-action="plC" disabled>pl c</button>${helpQ('plC')}</div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" data-cmd="stats;" data-he-action="stats" disabled>stats</button>${helpQ('stats')}</div>
            <div class="ctl-with-help"><button type="button" class="tool-btn" id="btn-stop-stats" data-he-action="stopStats" disabled>stop stats</button>${helpQ('stopStats')}</div>
          </div>
          <div class="mlrs-bottom-bar">
            <dl class="lua-info lua-info--bar">
              <dt class="sr-only">Tx</dt>
              <dd id="info-tx" class="mlrs-pill" title="Tx">—</dd>
              <dt class="sr-only">Rx</dt>
              <dd id="info-rx" class="mlrs-pill" title="Rx">—</dd>
              <dt class="sr-only">Tx Power</dt>
              <dd id="info-txp" class="mlrs-pill" title="Tx Power">—</dd>
              <dt class="sr-only">Rx Power</dt>
              <dd id="info-rxp" class="mlrs-pill" title="Rx Power">—</dd>
            </dl>
            <div class="mlrs-bottom-help">
              <span class="ctl-with-help"><span class="mlrs-bottom-help-label">Tx</span>${helpQ('infoTx')}</span>
              <span class="ctl-with-help"><span class="mlrs-bottom-help-label">Rx</span>${helpQ('infoRx')}</span>
            </div>
          </div>
        </main>
        <aside class="he-sidebar" dir="rtl">
        <div class="he-sidebar-body">
          <div class="he-tabs" role="tablist" dir="ltr">
            <button type="button" class="he-tab-btn active" data-tab="manual" role="tab" aria-selected="true">ספר הוראות</button>
            <button type="button" class="he-tab-btn" data-tab="chat" role="tab" aria-selected="false">עוזר mLRS (AI)</button>
          </div>
          <div class="he-tab-panel" data-tab-panel="manual" role="tabpanel">
            <div class="he-manual">${getManualHtml()}</div>
          </div>
          <div class="he-tab-panel he-tab-panel--chat" data-tab-panel="chat" role="tabpanel" hidden>
            <div class="chat-panel-intro">
              <span>תיעוד GitHub + לוג. שרת 3001 + GEMINI_API_KEY.</span>
              ${helpQ('chatPanel')}
            </div>
            <p id="mlrs-chat-status" class="mlrs-chat-status"></p>
            <div id="mlrs-chat-messages" class="mlrs-chat-messages" aria-live="polite"></div>
            <div class="mlrs-chat-toolbar">
              <div class="ctl-with-help">
                <button type="button" class="tool-btn" id="btn-attach-log">צרף לוג</button>
                ${helpQ('btnAttachLog')}
              </div>
            </div>
            <textarea id="mlrs-chat-input" class="mlrs-chat-input" rows="2" dir="rtl" placeholder="שאלה קצרה…"></textarea>
            <div class="ctl-with-help mlrs-chat-sendrow">
              <button type="button" class="tool-btn primary" id="btn-mlrs-chat-send">שלח</button>
              ${helpQ('btnChatSend')}
            </div>
          </div>
        </div>
        <h2 class="he-sidebar-title he-sidebar-title--second">אחרי הפעולה האחרונה</h2>
        <div id="he-last-action" class="he-context-box">לחץ על כפתור או בחר מצב חיבור — כאן יופיע הסבר בעברית על מה שקרה.</div>
        <div class="he-sidebar-foot">
          <a class="he-foot-btn" href="https://github.com/olliw42/mLRS-docu/blob/master/docs/CLI.md" target="_blank" rel="noreferrer">מסמכים</a>
          <a class="he-foot-btn" href="https://olliw.eu/mlrsflasher" target="_blank" rel="noreferrer">אודות / צריבה</a>
        </div>
      </aside>
    </div>
      <footer class="mlrs-global-dock" aria-label="סטטוס קישור">
        <span class="mlrs-dock-label">LINK</span>
        <span class="mlrs-dock-pill" id="mlrs-dock-link">—</span>
        <span class="mlrs-dock-conn" id="mlrs-dock-conn">DISCONNECTED</span>
        <span class="mlrs-dock-ver">Lua ${LUA_SCRIPT_REF} · CLI</span>
      </footer>
    </div>
  `;

  const ui = collectUiRefs(root);
  const { logEl, statusEl } = ui;
  const heLastEl = /** @type {HTMLElement | null} */ (root.querySelector('#he-last-action'));
  const serialBtnWrap = /** @type {HTMLElement | null} */ (root.querySelector('#serial-btn-wrap'));
  const wsBtnWrap = /** @type {HTMLElement | null} */ (root.querySelector('#ws-btn-wrap'));

  /**
   * Why: User asked for Hebrew explanation in the sidebar after each control use.
   * What: Sets the sidebar paragraph text from HE_AFTER_CLICK when an action id is known.
   * @param {string} actionId
   */
  function showHeContext(actionId) {
    const t = HE_AFTER_CLICK[actionId];
    if (heLastEl && t) heLastEl.textContent = t;
  }

  const modeSerial = /** @type {HTMLInputElement} */ (root.querySelector('input[value="serial"]'));
  const modeWifi = /** @type {HTMLInputElement} */ (root.querySelector('input[value="wifi"]'));
  const wifiFields = /** @type {HTMLElement} */ (root.querySelector('#wifi-fields'));

  function syncConnModeUi() {
    const wifi = modeWifi?.checked;
    wifiFields.style.display = wifi ? 'flex' : 'none';
    if (serialBtnWrap) serialBtnWrap.style.display = wifi ? 'none' : 'flex';
    if (wsBtnWrap) wsBtnWrap.style.display = wifi ? 'flex' : 'none';
  }
  modeSerial?.addEventListener('change', () => {
    syncConnModeUi();
    showHeContext('modeSerial');
  });
  modeWifi?.addEventListener('change', () => {
    syncConnModeUi();
    showHeContext('modeWifi');
  });
  syncConnModeUi();

  const dockLinkEl = root.querySelector('#mlrs-dock-link');
  const dockConnEl = root.querySelector('#mlrs-dock-conn');

  /**
   * Why: Bottom dock should mirror Stitch “LINK / CONNECTED” without changing every transport call site.
   * What: Syncs from #status text via MutationObserver; highlights CONNECTED when not “Disconnected”.
   */
  function syncStatusDock() {
    if (!statusEl || !dockLinkEl || !dockConnEl) return;
    const t = (statusEl.textContent || '').trim();
    dockLinkEl.textContent = t.length > 36 ? `${t.slice(0, 33)}…` : t || '—';
    const disconnected = t === 'Disconnected' || t === '';
    dockConnEl.textContent = disconnected ? 'DISCONNECTED' : 'CONNECTED';
    dockConnEl.classList.toggle('mlrs-dock-conn--on', !disconnected);
  }

  const statusObserver = new MutationObserver(() => syncStatusDock());
  statusObserver.observe(statusEl, { childList: true, characterData: true, subtree: true });
  syncStatusDock();

  root.querySelector('#btn-chrome-connect')?.addEventListener('click', () => {
    if (modeWifi?.checked) ui.wsBtn.click();
    else ui.serialBtn.click();
  });

  ui.serialBtn.addEventListener('click', () => connectSerialTransport(logEl, statusEl, ui, showHeContext));
  ui.wsBtn.addEventListener('click', () =>
    connectWebSocketTransport(logEl, statusEl, ui, ui.wsUrlInput.value, showHeContext),
  );
  ui.disconnectBtn.addEventListener('click', () => {
    showHeContext('btnDisconnect');
    void disconnectAll(logEl, statusEl, ui, { verbose: true });
  });
  root.querySelector('#btn-clear')?.addEventListener('click', () => {
    showHeContext('btnClear');
    logEl.value = '';
  });

  for (const b of root.querySelectorAll('[data-cmd]')) {
    b.addEventListener('click', () => {
      const ha = b.getAttribute('data-he-action');
      if (ha) showHeContext(ha);
      const cmd = b.getAttribute('data-cmd');
      if (cmd) void sendCliCommand(cmd, logEl);
    });
  }
  root.querySelector('#btn-stop-stats')?.addEventListener('click', () => {
    showHeContext('stopStats');
    void sendStatsStopByte(logEl);
  });

  ui.sendBtn.addEventListener('click', () => {
    showHeContext('send');
    void sendCliCommand(ui.cmdInput.value, logEl);
    ui.cmdInput.value = '';
  });
  ui.cmdInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      showHeContext('send');
      void sendCliCommand(ui.cmdInput.value, logEl);
      ui.cmdInput.value = '';
    }
  });

  const quickSel = /** @type {HTMLSelectElement | null} */ (root.querySelector('#quick-param-id'));
  const quickVal = /** @type {HTMLInputElement | null} */ (root.querySelector('#quick-param-val'));
  const quickCliKey = /** @type {HTMLInputElement | null} */ (root.querySelector('#quick-cli-key'));
  const wrapQuickKey = /** @type {HTMLElement | null} */ (root.querySelector('#wrap-quick-cli-key'));
  const quickHint = /** @type {HTMLElement | null} */ (root.querySelector('#quick-param-hint'));
  if (quickSel) {
    for (const p of MLRS_QUICK_PARAMS) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.labelHe;
      quickSel.appendChild(o);
    }
  }

  /**
   * Why: Keep the Hebrew hint in sync with the selected quick parameter row.
   * What: Shows hintHe and toggles custom CLI key field.
   */
  function syncQuickParamUi() {
    const id = quickSel?.value;
    const def = MLRS_QUICK_PARAMS.find((p) => p.id === id);
    if (quickHint) quickHint.textContent = def?.hintHe || '';
    if (wrapQuickKey) wrapQuickKey.style.display = id === 'custom' ? 'block' : 'none';
  }
  quickSel?.addEventListener('change', syncQuickParamUi);
  syncQuickParamUi();

  root.querySelector('#btn-quick-send')?.addEventListener('click', () => {
    const id = quickSel?.value;
    const def = MLRS_QUICK_PARAMS.find((p) => p.id === id);
    let cliKey = def?.cliKey || '';
    if (id === 'custom') {
      cliKey = sanitizeParamValue(quickCliKey?.value || '').replace(/\s+/g, '_');
    }
    const val = sanitizeParamValue(quickVal?.value || '');
    if (!cliKey || !val) {
      appendLog(logEl, 'Quick set: choose parameter and value (non-empty).', 'sys');
      return;
    }
    showHeContext('btnQuickSend');
    void sendCliCommand(`p ${cliKey} = ${val}`, logEl);
  });

  root.querySelectorAll('.he-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (!tab) return;
      root.querySelectorAll('.he-tab-btn').forEach((b) => {
        const on = b.getAttribute('data-tab') === tab;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      root.querySelectorAll('.he-tab-panel').forEach((p) => {
        p.hidden = p.getAttribute('data-tab-panel') !== tab;
      });
    });
  });

  const chatMessagesEl = /** @type {HTMLElement | null} */ (root.querySelector('#mlrs-chat-messages'));
  const chatStatusEl = /** @type {HTMLElement | null} */ (root.querySelector('#mlrs-chat-status'));
  const chatInput = /** @type {HTMLTextAreaElement | null} */ (root.querySelector('#mlrs-chat-input'));
  /** @type {{ role: string, text: string }[]} */
  const mlrsChatHistory = [];
  let attachLogNext = false;

  /**
   * Why: Render chat bubbles without a framework.
   * What: Rebuilds #mlrs-chat-messages from mlrsChatHistory.
   */
  /** How many chat bubbles to render so the sidebar stays a single fixed viewport without scrolling. */
  const MLRS_CHAT_VISIBLE_MESSAGES = 8;

  function renderMlrsChat() {
    if (!chatMessagesEl) return;
    chatMessagesEl.innerHTML = '';
    const slice = mlrsChatHistory.slice(-MLRS_CHAT_VISIBLE_MESSAGES);
    for (const m of slice) {
      const div = document.createElement('div');
      div.className = `mlrs-chat-bubble mlrs-chat-bubble--${m.role}`;
      div.textContent = m.text;
      chatMessagesEl.appendChild(div);
    }
  }

  root.querySelector('#btn-attach-log')?.addEventListener('click', () => {
    attachLogNext = true;
    if (chatStatusEl) {
      chatStatusEl.textContent = 'בשאלה הבאה יוצמד סוף לוג ה-CLI (בנוסף להקשר הרגיל).';
    }
  });

  root.querySelector('#btn-mlrs-chat-send')?.addEventListener('click', async () => {
    const raw = chatInput?.value?.trim() || '';
    if (!raw) return;
    let userText = raw;
    if (attachLogNext) {
      const tail = logEl.value.slice(-6000);
      userText = `[המשתמש ביקש לצרף לוג]\n${tail}\n\n---\nשאלה:\n${raw}`;
      attachLogNext = false;
      if (chatStatusEl) chatStatusEl.textContent = '';
    }
    mlrsChatHistory.push({ role: 'user', text: raw });
    if (chatInput) chatInput.value = '';
    renderMlrsChat();
    const messagesForApi = mlrsChatHistory
      .slice(0, -1)
      .concat([{ role: 'user', text: userText }]);
    try {
      const { text } = await sendMlrsChat(messagesForApi, {
        live: {
          transport: transportKind,
          statusLine: statusEl.textContent,
        },
        logTail: logEl.value.slice(-12000),
      });
      mlrsChatHistory.push({ role: 'assistant', text: text || '(ריק)' });
      showHeContext('chatSent');
    } catch (e) {
      mlrsChatHistory.push({
        role: 'assistant',
        text: `שגיאה: ${e?.message || e}. ודא ששרת הרץ על פורט 3001 ו-GEMINI_API_KEY ב-server/.env`,
      });
    }
    renderMlrsChat();
  });

  void fetchGeminiStatus().then((st) => {
    if (!chatStatusEl) return;
    if (st?.ok) {
      chatStatusEl.textContent = 'Gemini מוכן (שרת + מפתח).';
    } else {
      chatStatusEl.textContent = st?.reason
        ? `עוזר לא זמין: ${st.reason}`
        : 'אין חיבור לעוזר: הרץ npm run dev:server בשורש הפרויקט והגדר GEMINI_API_KEY ב-server/.env';
    }
  });

  setConnectedUi(ui, false);
  if (!isWebSerialSupported()) {
    appendLog(logEl, 'Tip: Web Serial missing — use WiFi bridge mode or Chrome/Edge.', 'sys');
  }
}

mountApp();
