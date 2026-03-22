import { startTransition, useCallback, useRef, useState } from 'react';

function errorText(err) {
  if (err == null) return 'Parse error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  return String(err);
}

export function useBinParser() {
  const [fields, setFields] = useState([]);
  const [messages, setMessages] = useState({});
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  const parseFile = useCallback((arrayBuffer) => {
    workerRef.current?.terminate();
    workerRef.current = null;

    setLoading(true);
    setError(null);
    setProgress(0);
    setFields([]);
    setMessages({});

    if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength === 0) {
      setError(arrayBuffer instanceof ArrayBuffer ? 'File is empty' : 'Invalid file data');
      setLoading(false);
      return;
    }

    const worker = new Worker(
      new URL('../parsers/binParser.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, percent, fields: f, messages: m, error: err } = e.data;
      if (type === 'PROGRESS') setProgress(percent ?? 0);
      if (type === 'FIELDS') setFields(f ?? []);
      if (type === 'DONE') {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setLoading(false);
        if (err) setError(errorText(err));
        const payload = m ?? {};
        // Large `messages` makes React commit expensive; yield + transition keeps tab responsive.
        requestAnimationFrame(() => {
          startTransition(() => setMessages(payload));
        });
      }
    };

    worker.onerror = (ev) => {
      const msg = ev.message || (ev.error && ev.error.message) || 'Worker failed to run (check console)';
      setError(msg);
      setLoading(false);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };

    try {
      worker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (e) {
      setError(errorText(e) || 'Could not send file to parser (buffer may already be in use)');
      setLoading(false);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    }
  }, []);

  const getTimeSeries = useCallback((fieldKey) => {
    const dot = fieldKey.indexOf('.');
    if (dot === -1) return null;
    const msgName = fieldKey.slice(0, dot);
    const fieldName = fieldKey.slice(dot + 1);
    let msg = messages[msgName];
    if (!msg && messages[msgName + '[0]']) msg = messages[msgName + '[0]'];
    if (!msg) return null;
    const time = msg.time_boot_ms || msg.TimeUS;
    const values = msg[fieldName];
    if (!time || !values) return null;
    const len = Math.min(time.length, values.length);
    return {
      x: Array.from(time).slice(0, len),
      y: Array.from(values).slice(0, len),
      name: fieldKey
    };
  }, [messages]);

  const reset = useCallback(() => {
    setFields([]);
    setMessages({});
    setProgress(0);
    setLoading(false);
    setError(null);
  }, []);

  return { fields, messages, progress, parseFile, reset, loading, error, getTimeSeries };
}
