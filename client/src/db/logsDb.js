/** IndexedDB wrapper for vehicles, logs, chart/map presets */
const DB_NAME = 'SmartLogViewer';
const DB_VERSION = 2;
const STORES = ['vehicles', 'logs', 'chartPresets', 'mapPresets', 'reportCsvPresets', 'reportPdfPresets'];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
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
    };
  });
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
    rawBin: arrayBuffer,
    flightDate: meta?.flightDate || null,
    nearestCity: meta?.nearestCity || null,
    savedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readwrite');
    tx.objectStore('logs').add(log);
    tx.oncomplete = () => resolve(log);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLog(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readonly');
    const req = tx.objectStore('logs').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateLog(id, updates) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) { reject(new Error('Log not found')); return; }
      const updated = { ...existing, ...updates };
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
    const tx = db.transaction('logs', 'readwrite');
    tx.objectStore('logs').delete(id);
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
