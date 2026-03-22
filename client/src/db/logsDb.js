/** IndexedDB wrapper for vehicles, logs, chart/map presets */
const DB_NAME = 'SmartLogViewer';
const DB_VERSION = 3;

let dbOpenPromise = null;

function openDb() {
  if (dbOpenPromise) return dbOpenPromise;
  dbOpenPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => {
      dbOpenPromise = null;
      reject(req.error);
    };
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      const oldV = e.oldVersion;

      if (!db.objectStoreNames.contains('vehicles')) {
        db.createObjectStore('vehicles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('logs')) {
        const logs = db.createObjectStore('logs', { keyPath: 'id' });
        logs.createIndex('vehicleId', 'vehicleId', { unique: false });
      }
      if (!db.objectStoreNames.contains('chartPresets')) {
        db.createObjectStore('chartPresets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('mapPresets')) {
        db.createObjectStore('mapPresets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reportCsvPresets')) {
        db.createObjectStore('reportCsvPresets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reportPdfPresets')) {
        db.createObjectStore('reportPdfPresets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('logBlobs')) {
        db.createObjectStore('logBlobs', { keyPath: 'logId' });
      }

      /* v2 → v3: move raw ArrayBuffers out of `logs` so getLogs() stays lightweight */
      if (oldV < 3 && oldV >= 1 && db.objectStoreNames.contains('logs') && db.objectStoreNames.contains('logBlobs')) {
        const tx = e.target.transaction;
        const logsStore = tx.objectStore('logs');
        const blobsStore = tx.objectStore('logBlobs');
        logsStore.openCursor().onsuccess = (ev) => {
          const cursor = ev.target.result;
          if (!cursor) return;
          const val = cursor.value;
          if (val.rawBin instanceof ArrayBuffer) {
            blobsStore.put({ logId: val.id, buffer: val.rawBin });
            cursor.update({
              id: val.id,
              vehicleId: val.vehicleId,
              displayName: val.displayName,
              originalName: val.originalName ?? null,
              flightDate: val.flightDate ?? null,
              nearestCity: val.nearestCity ?? null,
              savedAt: val.savedAt ?? Date.now(),
            });
          }
          cursor.continue();
        };
      }
    };
  });
  return dbOpenPromise;
}

export async function getVehicles() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vehicles', 'readonly');
    const req = tx.objectStore('vehicles').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addVehicle(name) {
  const db = await openDb();
  const id = `v_${Date.now()}`;
  const vehicle = { id, name: (name || '').trim() || 'כטב"ם חדש', photo: null, createdAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vehicles', 'readwrite');
    tx.objectStore('vehicles').add(vehicle);
    tx.oncomplete = () => resolve(vehicle);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateVehicle(id, updates) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vehicles', 'readwrite');
    const store = tx.objectStore('vehicles');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) { reject(new Error('Vehicle not found')); return; }
      const updated = { ...existing, ...updates };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteVehicle(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vehicles', 'readwrite');
    tx.objectStore('vehicles').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** List logs for UI — metadata only (no raw bin), fast even with many large logs */
export async function getLogs(vehicleId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readonly');
    const idx = tx.objectStore('logs').index('vehicleId');
    const req = idx.getAll(vehicleId);
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    req.onerror = () => reject(req.error);
  });
}

export async function saveLog(vehicleId, arrayBuffer, meta) {
  const db = await openDb();
  const id = `log_${Date.now()}`;
  const log = {
    id,
    vehicleId,
    displayName: meta?.displayName || 'לוג',
    originalName: meta?.originalName || null,
    flightDate: meta?.flightDate || null,
    nearestCity: meta?.nearestCity || null,
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['logs', 'logBlobs'], 'readwrite');
    tx.objectStore('logs').add(log);
    tx.objectStore('logBlobs').put({ logId: id, buffer: arrayBuffer });
    tx.oncomplete = () => resolve({ ...log, rawBin: arrayBuffer });
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLog(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['logs', 'logBlobs'], 'readonly');
    const logsStore = tx.objectStore('logs');
    const blobsStore = tx.objectStore('logBlobs');
    const getReq = logsStore.get(id);
    getReq.onsuccess = () => {
      const meta = getReq.result;
      if (!meta) {
        resolve(null);
        return;
      }
      const blobReq = blobsStore.get(id);
      blobReq.onsuccess = () => {
        const row = blobReq.result;
        if (row?.buffer instanceof ArrayBuffer) {
          resolve({ ...meta, rawBin: row.buffer });
          return;
        }
        if (meta.rawBin instanceof ArrayBuffer) {
          resolve(meta);
          return;
        }
        resolve(meta);
      };
      blobReq.onerror = () => reject(blobReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateLog(id, updates) {
  const { rawBin: _rb, buffer: _buf, ...safe } = updates;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) { reject(new Error('Log not found')); return; }
      const updated = { ...existing, ...safe };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLog(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['logs', 'logBlobs'], 'readwrite');
    tx.objectStore('logs').delete(id);
    tx.objectStore('logBlobs').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChartPresets() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chartPresets', 'readonly');
    const req = tx.objectStore('chartPresets').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    req.onerror = () => reject(req.error);
  });
}

export async function saveChartPreset(preset) {
  const db = await openDb();
  const id = preset.id || `cp_${Date.now()}`;
  const p = {
    id,
    name: preset.name || 'פריסט',
    selectedFields: preset.selectedFields || [],
    fieldColors: preset.fieldColors || {},
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chartPresets', 'readwrite');
    tx.objectStore('chartPresets').put(p);
    tx.oncomplete = () => resolve(p);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteChartPreset(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chartPresets', 'readwrite');
    tx.objectStore('chartPresets').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMapPresets() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mapPresets', 'readonly');
    const req = tx.objectStore('mapPresets').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    req.onerror = () => reject(req.error);
  });
}

export async function saveMapPreset(preset) {
  const db = await openDb();
  const id = preset.id || `mp_${Date.now()}`;
  const p = {
    id,
    name: preset.name || 'פריסט מפה',
    pathColorConfig: preset.pathColorConfig || null,
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mapPresets', 'readwrite');
    tx.objectStore('mapPresets').put(p);
    tx.oncomplete = () => resolve(p);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteMapPreset(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mapPresets', 'readwrite');
    tx.objectStore('mapPresets').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getReportCsvPresets() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reportCsvPresets', 'readonly');
    const req = tx.objectStore('reportCsvPresets').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    req.onerror = () => reject(req.error);
  });
}

export async function saveReportCsvPreset(preset) {
  const db = await openDb();
  const id = preset.id || `rcp_${Date.now()}`;
  const p = {
    id,
    name: preset.name || 'CSV preset',
    fields: preset.fields || [],
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reportCsvPresets', 'readwrite');
    tx.objectStore('reportCsvPresets').put(p);
    tx.oncomplete = () => resolve(p);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getReportPdfPresets() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reportPdfPresets', 'readonly');
    const req = tx.objectStore('reportPdfPresets').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)));
    req.onerror = () => reject(req.error);
  });
}

export async function saveReportPdfPreset(preset) {
  const db = await openDb();
  const id = preset.id || `rpp_${Date.now()}`;
  const p = {
    id,
    name: preset.name || 'PDF preset',
    titleTemplate: preset.titleTemplate || '',
    observationsTemplate: preset.observationsTemplate || '',
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reportPdfPresets', 'readwrite');
    tx.objectStore('reportPdfPresets').put(p);
    tx.oncomplete = () => resolve(p);
    tx.onerror = () => reject(tx.error);
  });
}
