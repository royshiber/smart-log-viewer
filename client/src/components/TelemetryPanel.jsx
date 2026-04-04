import { useEffect, useMemo, useState } from 'react';
import { fetchTelemetryEvents, fetchTelemetryLinkStatus, pushTelemetryEvent } from '../api/telemetry';

function levelClass(level) {
  if (level === 'error') return 'text-red-300 border-red-500/40';
  if (level === 'warn') return 'text-amber-300 border-amber-500/40';
  return 'text-onSurface border-border/70';
}

export function TelemetryPanel({ isRtl }) {
  const [events, setEvents] = useState([]);
  const [since, setSince] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');
  const [linkStatus, setLinkStatus] = useState(null);

  useEffect(() => {
    let active = true;
    let timer;
    let sinceCursor = since;
    // Why: keep a near-real-time operator view of companion/system events.
    // What: polls telemetry events endpoint and appends new entries incrementally.
    const tick = async () => {
      try {
        const result = await fetchTelemetryEvents(sinceCursor);
        if (!active) return;
        const nextItems = Array.isArray(result?.items) ? result.items : [];
        if (nextItems.length) {
          setEvents((prev) => [...prev, ...nextItems].slice(-250));
        }
        sinceCursor = result?.now || Date.now();
        setSince(sinceCursor);
        setConnectionState('online');
      } catch {
        if (active) setConnectionState('offline');
      } finally {
        if (active) timer = setTimeout(tick, 1500);
      }
    };
    tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer;
    const pollStatus = async () => {
      try {
        const status = await fetchTelemetryLinkStatus();
        if (!active) return;
        setLinkStatus(status);
      } catch {}
      if (active) timer = setTimeout(pollStatus, 3000);
    };
    pollStatus();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const groupedCounts = useMemo(() => {
    return events.reduce((acc, ev) => {
      acc[ev.type || 'other'] = (acc[ev.type || 'other'] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const sendDemoEvent = async () => {
    // Why: allow fast end-to-end validation before live FC/RPi wiring is ready.
    // What: injects a representative vision event through the backend telemetry API.
    await pushTelemetryEvent({
      type: 'vision',
      level: 'info',
      text: 'Demo vision event (UI test)',
      data: { lateralOffsetM: 0.7, headingErrorDeg: -1.9, confidence: 0.92 },
    });
  };

  return (
    <div className="h-full overflow-auto px-4 py-3 text-onSurface">
      <div className="rounded-xl border border-border bg-surfaceRaised p-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-accent">
            {isRtl ? 'טלמטריה והודעות מערכת' : 'Telemetry and system messages'}
          </h2>
          <span className={`text-xs px-2 py-0.5 border ${connectionState === 'online' ? 'bg-green-50 text-green-900 border-green-200' : connectionState === 'offline' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
            {connectionState === 'online' ? (isRtl ? 'מחובר' : 'Online') : connectionState === 'offline' ? (isRtl ? 'מנותק' : 'Offline') : (isRtl ? 'מתחבר...' : 'Connecting...')}
          </span>
        </div>
        <p className="text-xs text-muted mt-1">
          {isRtl ? 'תצוגת אירועים חיה לניטור ניסויים, תקלות והודעות קריטיות.' : 'Live event stream for monitoring tests, faults, and critical messages.'}
        </p>
        <div className="mt-2 text-xs text-muted">
          {isRtl ? 'גשר UDP:' : 'UDP bridge:'}{' '}
          {linkStatus?.enabled
            ? `${linkStatus.host}:${linkStatus.port} · ${linkStatus.healthy ? (isRtl ? 'פעיל' : 'Healthy') : (isRtl ? 'ממתין לחבילות' : 'Waiting for packets')}`
            : (isRtl ? 'כבוי (TELEMETRY_UDP_PORT לא הוגדר)' : 'Disabled (TELEMETRY_UDP_PORT not set)')}
          {linkStatus?.enabled ? ` · pkts=${linkStatus.packetsReceived ?? 0} · errs=${linkStatus.parseErrors ?? 0}` : ''}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { sendDemoEvent().catch(() => {}); }}
            className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
          >
            {isRtl ? 'שלח אירוע דמו' : 'Send demo event'}
          </button>
          {Object.entries(groupedCounts).map(([type, count]) => (
            <span key={type} className="text-xs px-2 py-0.5 rounded bg-black/30 border border-border/60">
              {type}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-sm text-muted">{isRtl ? 'עדיין אין אירועים.' : 'No events yet.'}</div>
        ) : events.slice().reverse().map((event) => (
          <article key={event.id} className={`rounded-lg border bg-surface p-3 ${levelClass(event.level)}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wide opacity-80">{event.type || 'event'}</span>
              <span className="text-xs opacity-70">{new Date(event.ts).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm mt-1">{event.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
