import { useCallback, useState } from 'react';

export function useBinParser() {
  const [fields, setFields] = useState([]);
  const [messages, setMessages] = useState({});
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseFile = useCallback((arrayBuffer) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setFields([]);
    setMessages({});

    const worker = new Worker(
      new URL('../parsers/binParser.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type, percent, fields: f, messages: m, error: err } = e.data;
      if (type === 'PROGRESS') setProgress(percent ?? 0);
      if (type === 'FIELDS') setFields(f ?? []);
      if (type === 'DONE') {
        setMessages(m ?? {});
        setLoading(false);
        if (err) setError(err);
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      setError(err.message || 'Parse error');
      setLoading(false);
      worker.terminate();
    };

    worker.postMessage(arrayBuffer, [arrayBuffer]);
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
