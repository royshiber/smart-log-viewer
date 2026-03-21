const API_BASE = '/api';

/**
 * Stream chart analysis tokens via SSE.
 * onDelta(text) is called for each token chunk.
 * Returns the full assembled text when done.
 */
export async function streamChatMessage(messages, context, onDelta) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      try {
        const event = JSON.parse(raw);
        if (event.error) throw new Error(event.error);
        if (event.delta) { onDelta(event.delta); full += event.delta; }
        if (event.done) return full;
      } catch (e) {
        if (e.message && !e.message.includes('JSON')) throw e;
      }
    }
  }
  return full;
}

export async function sendChatMessage(messages, context) {
  const res = await fetch(`${API_BASE}/chat`, {
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

export async function sendUnifiedChatMessage(messages, context, path, mapView, availableFields, currentMapState, savedCommands) {
  const res = await fetch(`${API_BASE}/unified-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context, path, mapView, availableFields, currentMapState, savedCommands }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/**
 * Parse graph request via Gemini - maps natural language to field names.
 * Returns { fields: [{ name, color }] } or throws.
 */
export async function parseGraphRequestViaGemini(request, availableFields) {
  const res = await fetch(`${API_BASE}/parse-graph-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, availableFields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  const data = await res.json();
  return { fields: data.fields || [] };
}

export async function sendMapChatMessage(messages, path, mapView, availableFields) {
  const res = await fetch(`${API_BASE}/map-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, path, mapView, availableFields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function getGeminiStatus() {
  const res = await fetch(`${API_BASE}/gemini-status`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}
