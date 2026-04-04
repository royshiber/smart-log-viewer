/**
 * Why: mLRS desktop app runs on Vite :3020; Smart Log server holds GEMINI_API_KEY on :3001.
 * What: POST /api/mlrs-chat with messages + live context (proxied by Vite dev server).
 * @param {{ role: string, text: string }[]} messages
 * @param {{ live?: object, logTail?: string }} context
 */
/**
 * Why: Vite proxy may return HTML "Internal Server Error" when :3001 is down — not JSON.
 * What: Parses JSON when possible; maps generic 5xx to a clear Hebrew hint for operators.
 * @param {Response} res
 * @param {string} bodyText
 */
function errorMessageFromResponse(res, bodyText) {
  let data = {};
  try {
    data = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    /* plain text or HTML */
  }
  const fromJson = typeof data.error === 'string' ? data.error : '';
  const trimmed = bodyText?.trim() || '';
  const shortBody =
    trimmed && !trimmed.startsWith('<') && trimmed.length < 500 ? trimmed : '';
  const raw = fromJson || shortBody || res.statusText || 'HTTP error';
  if (
    res.status >= 500 &&
    (raw === 'Internal Server Error' || raw.includes('ECONNREFUSED') || !fromJson)
  ) {
    return 'השרת על פורט 3001 לא זמין או לא החזיר JSON. הרץ npm run dev:server מהשורש הפרויקט והגדר GEMINI_API_KEY ב-server/.env';
  }
  return raw;
}

export async function sendMlrsChat(messages, context) {
  const res = await fetch('/api/mlrs-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(res, bodyText));
  }
  try {
    return bodyText ? JSON.parse(bodyText) : {};
  } catch {
    throw new Error('תשובת שרת לא תקינה (לא JSON). בדוק ש-dev:server רץ על 3001.');
  }
}

/**
 * Why: Show whether the user configured the API key before typing long questions.
 * What: GET /api/gemini-status
 */
export async function fetchGeminiStatus() {
  try {
    const res = await fetch('/api/gemini-status');
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        reason: errorMessageFromResponse(res, text),
      };
    }
    try {
      return text ? JSON.parse(text) : { ok: false, reason: 'ריק' };
    } catch {
      return { ok: false, reason: 'תשובת סטטוס לא תקינה' };
    }
  } catch {
    return {
      ok: false,
      reason:
        'אין חיבור לשרת (פורט 3001). הרץ npm run dev:server מהשורש — ה-Vite מפנה /api לשם.',
    };
  }
}
