export async function fetchTelemetryEvents(since = 0) {
  const response = await fetch(`/api/telemetry/events?since=${encodeURIComponent(String(since || 0))}`);
  if (!response.ok) throw new Error(`Telemetry fetch failed: ${response.status}`);
  return response.json();
}

export async function fetchTelemetryLinkStatus() {
  const response = await fetch('/api/telemetry/link-status');
  if (!response.ok) throw new Error(`Telemetry link status failed: ${response.status}`);
  return response.json();
}

export async function pushTelemetryEvent(payload) {
  const response = await fetch('/api/telemetry/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!response.ok) throw new Error(`Telemetry push failed: ${response.status}`);
  return response.json();
}
