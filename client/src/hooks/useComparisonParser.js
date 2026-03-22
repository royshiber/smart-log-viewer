import { startTransition, useState, useCallback } from 'react';

/**
 * Manages multiple parsed BIN comparisons.
 * Each comparison has: id, vehicleName, logName, fields, messages, loading.
 */
export function useComparisonParser() {
  const [comparisons, setComparisons] = useState([]);

  const addComparison = useCallback((id, vehicleName, logName, arrayBuffer, vehicleId = null) => {
    setComparisons((prev) => {
      if (prev.find((c) => c.id === id)) return prev;
      return [...prev, { id, vehicleId, vehicleName, logName, fields: [], messages: {}, loading: true }];
    });

    const worker = new Worker(
      new URL('../parsers/binParser.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type, fields: f, messages: m } = e.data;
      if (type === 'FIELDS') {
        setComparisons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, fields: f ?? [] } : c))
        );
      }
      if (type === 'DONE') {
        worker.terminate();
        const payload = m ?? {};
        requestAnimationFrame(() => {
          startTransition(() => {
            setComparisons((prev) =>
              prev.map((c) => (c.id === id ? { ...c, messages: payload, loading: false } : c))
            );
          });
        });
      }
    };

    worker.onerror = () => {
      setComparisons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, loading: false } : c))
      );
      worker.terminate();
    };

    worker.postMessage(arrayBuffer, [arrayBuffer]);
  }, []);

  const removeComparison = useCallback((id) => {
    setComparisons((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getComparisonTimeSeries = useCallback((compId, fieldKey) => {
    const comp = comparisons.find((c) => c.id === compId);
    if (!comp) return null;
    const dot = fieldKey.indexOf('.');
    if (dot === -1) return null;
    const msgName = fieldKey.slice(0, dot);
    const fieldName = fieldKey.slice(dot + 1);
    let msg = comp.messages[msgName];
    if (!msg && comp.messages[msgName + '[0]']) msg = comp.messages[msgName + '[0]'];
    if (!msg) return null;
    const time = msg.time_boot_ms || msg.TimeUS;
    const values = msg[fieldName];
    if (!time || !values) return null;
    const len = Math.min(time.length, values.length);
    return {
      x: Array.from(time).slice(0, len),
      y: Array.from(values).slice(0, len),
      name: fieldKey,
    };
  }, [comparisons]);

  return { comparisons, addComparison, removeComparison, getComparisonTimeSeries };
}
