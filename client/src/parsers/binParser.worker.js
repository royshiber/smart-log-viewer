/**
 * Web Worker - parses ArduPilot BIN files using JsDataflashParser
 * Receives: ArrayBuffer via postMessage
 * Sends:
 *   { type: 'PROGRESS', percent: 0-100 }
 *   { type: 'FIELDS', fields: ['ATT.Roll', 'ATT.Pitch', ...] }
 *   { type: 'DONE', messages: {...} }
 */
import DataflashParser from '../parser/parser.js';

function post(type, payload) {
  self.postMessage({ type, ...payload });
}

self.addEventListener('message', async (event) => {
  const buffer = event.data;
  if (!buffer || !(buffer instanceof ArrayBuffer)) {
    post('DONE', { messages: {}, error: 'Invalid buffer' });
    return;
  }

  try {
    post('PROGRESS', { percent: 0 });

    const parser = new DataflashParser(false);
    const result = parser.processData(buffer);

    post('PROGRESS', { percent: 100 });

    const fields = [];
    for (const [msgName, info] of Object.entries(result.types || {})) {
      const exp = info.expressions || (info.complexFields && Object.keys(info.complexFields));
      if (!exp) continue;
      const list = Array.isArray(exp) ? exp : Object.keys(exp);
      for (const f of list) {
        if (f !== 'TimeUS' && f !== 'time_boot_ms') {
          fields.push(`${msgName}.${f}`);
        }
      }
    }
    post('FIELDS', { fields });

    post('DONE', { messages: result.messages || {} });
  } catch (err) {
    console.error('Parse error:', err);
    post('DONE', { messages: {}, error: err.message });
  }
});
