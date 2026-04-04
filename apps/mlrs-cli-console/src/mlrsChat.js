/**
 * Why: mLRS desktop app runs on Vite :3020; Smart Log server holds GEMINI_API_KEY on :3001.
 * What: POST /api/mlrs-chat with messages + live context (proxied by Vite dev server).
 * @param {{ role: string, text: string }[]} messages
 * @param {{ live?: object, logTail?: string }} context
 */
export async function sendMlrsChat(messages, context) {
  const res = await fetch('/api/mlrs-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/**
 * Why: Show whether the user configured the API key before typing long questions.
 * What: GET /api/gemini-status
 */
export async function fetchGeminiStatus() {
  const res = await fetch('/api/gemini-status');
  if (!res.ok) return { ok: false, reason: 'HTTP error' };
  return res.json();
}
