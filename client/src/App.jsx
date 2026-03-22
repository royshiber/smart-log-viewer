import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldsSidebar } from './components/FieldsSidebar';
import { ChartPanel } from './components/ChartPanel';
import { MapPanel } from './components/MapPanel';
import { ReportsPanel } from './components/ReportsPanel';
import { RequestBar } from './components/RequestBar';
import { ChatPanel } from './components/ChatPanel';
import { VehicleGrid } from './components/VehicleGrid';
import { LandingScreen } from './components/LandingScreen';
import { LogList } from './components/LogList';
import { ChartPresetManager, MapPresetManager } from './components/PresetManager';
import { ComparisonSelector } from './components/ComparisonSelector';
import { FlightLogsCompareSelector } from './components/FlightLogsCompareSelector';
import { InputModal } from './components/InputModal';
import { useBinParser } from './hooks/useBinParser';
import { useFlightPath } from './hooks/useFlightPath';
import { usePathWithField } from './hooks/usePathWithField';
import { useComparisonParser } from './hooks/useComparisonParser';
import { parseGraphRequest, getAppendFromText, estimateMinFieldCount } from './utils/parseGraphRequest';
import { getFieldLabel } from './utils/fieldLabels';
import { sendUnifiedChatMessage, parseGraphRequestViaGemini } from './api/chat';
import { buildChatContext } from './utils/chatContext';
import { saveLog, getVehicles, getLogs, getLog } from './db/logsDb';
import { getNearestCity } from './utils/geocode';
import { extractFlightDate, buildLogDisplayName } from './utils/logNaming';
import { buildPathNavHeadingsDeg } from './utils/headingFromLog';
import { APP_VERSION, VERSION_WHATS_NEW } from './version';

/** Interpolate y at time t from time series (same logic as path altitude sampling). */
function interpolateSeriesAtTime(x, y, t) {
  if (!x?.length || !y?.length) return null;
  let lo = 0;
  let hi = x.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (x[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  const i1 = lo;
  const i0 = Math.max(0, i1 - 1);
  const x0 = x[i0];
  const x1 = x[i1];
  const y0 = Number(y[i0]);
  const y1 = Number(y[i1]);
  if (!Number.isFinite(y0) && !Number.isFinite(y1)) return null;
  if (!Number.isFinite(y0)) return y1;
  if (!Number.isFinite(y1) || x1 === x0) return y0;
  const frac = (t - x0) / (x1 - x0);
  return y0 + frac * (y1 - y0);
}

const COLORS = [
  '#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7', '#79c0ff', '#ff7b72', '#56d364',
  '#e6b800', '#6f42c1', '#22863a', '#dbab09', '#da6700', '#b3b3b3', '#1f6feb', '#ff00ff'
];

// Colors for comparison series (offset so they don't clash with primary series)
const COMP_COLORS = ['#f85149', '#d29922', '#a371f7', '#ff7b72'];

function VehicleMiniCard({ vehicle, onClick }) {
  if (!vehicle) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full min-h-[52px] px-3 py-2 rounded-xl bg-surfaceRaised border border-border hover:border-accent/50 transition-colors shadow-sm"
      title={vehicle.name}
    >
      {vehicle.photo ? (
        <img src={vehicle.photo} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border/50" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-border/50">
          <svg viewBox="0 0 48 48" className="w-7 h-7 opacity-70" fill="none">
            <ellipse cx="24" cy="24" rx="4" ry="12" fill="#b2dfdb" />
            <path d="M20 22 L4 30 L6 34 L20 27Z" fill="#80cbc4" />
            <path d="M28 22 L44 30 L42 34 L28 27Z" fill="#80cbc4" />
            <circle cx="24" cy="19" r="3" fill="#29b6f6" opacity="0.9" />
          </svg>
        </div>
      )}
      <span className="text-sm text-gray-200 truncate text-center leading-tight">{vehicle.name}</span>
    </button>
  );
}

function parseFrskyTable(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return new Map();
  const header = lines[0].split(/[,\t;]+/).map((x) => x.trim());
  const timeIdx = header.findIndex((h) => /^(time|timestamp|t|sec|seconds|ms)$/i.test(h));
  const tIdx = timeIdx >= 0 ? timeIdx : 0;
  const out = new Map();
  for (let i = 0; i < header.length; i += 1) {
    if (i !== tIdx) out.set(header[i], { x: [], y: [] });
  }
  for (let li = 1; li < lines.length; li += 1) {
    const cols = lines[li].split(/[,\t;]+/).map((x) => x.trim());
    const t = Number(cols[tIdx]);
    if (!Number.isFinite(t)) continue;
    for (let i = 0; i < header.length; i += 1) {
      if (i === tIdx) continue;
      const v = Number(cols[i]);
      if (!Number.isFinite(v)) continue;
      const ts = out.get(header[i]);
      if (!ts) continue;
      ts.x.push(t);
      ts.y.push(v);
    }
  }
  return out;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const { fields, messages, progress, parseFile, reset: resetParser, loading, error, getTimeSeries } = useBinParser();
  const { comparisons, addComparison, removeComparison, getComparisonTimeSeries } = useComparisonParser();
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldColors, setFieldColors] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('chart');
  const [mapMarkers, setMapMarkers] = useState([]);
  const [pathColorConfig, setPathColorConfig] = useState(null);
  const [fieldFeedback, setFieldFeedback] = useState(null);
  const [apiErrorToast, setApiErrorToast] = useState(null);
  const [graphRequestLoading, setGraphRequestLoading] = useState(false);
  const [geminiChatWidthPx, setGeminiChatWidthPx] = useState(() => {
    const raw = Number(localStorage.getItem('geminiChatWidthPx'));
    return Number.isFinite(raw) ? raw : 384;
  });
  const [logListWidthPx, setLogListWidthPx] = useState(() => {
    const raw = Number(localStorage.getItem('logListWidthPx'));
    return Number.isFinite(raw) ? raw : 192;
  });
  const [mapChatLoading, setMapChatLoading] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
  /** Pan map only when user picks time from chart (not when dragging map timeline). */
  const [mapPanRequest, setMapPanRequest] = useState(null);
  const [versionPopupOpen, setVersionPopupOpen] = useState(false);
  const [savedCommands, setSavedCommands] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mapSavedCommands') || '[]'); }
    catch { return []; }
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [logSaveCounter, setLogSaveCounter] = useState(0);
  const [currentLogName, setCurrentLogName] = useState('');
  /** DB id of log loaded from saved list (or after auto-save) — excluded from "add flight" overlay */
  const [activeLoadedLogId, setActiveLoadedLogId] = useState(null);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [visibleOverlayLogIds, setVisibleOverlayLogIds] = useState([]);
  const [frskyMap, setFrskyMap] = useState(new Map());
  const [frskyName, setFrskyName] = useState('');
  const [inputModal, setInputModal] = useState({ open: false, prompt: '', defaultValue: '' });
  const inputModalResolveRef = useRef(null);
  const pendingSaveRef = useRef(null);
  const uploadQueueRef = useRef([]);
  const uploadActiveRef = useRef(false);
  const mapRef = useRef(null);
  const vehicleGridRef = useRef(null);
  const mainLayoutRef = useRef(null);
  const [mainLayoutWidth, setMainLayoutWidth] = useState(0);

  const MIN_LOG_WIDTH = 160;
  const MAX_LOG_WIDTH = 760;
  const MIN_CHAT_WIDTH = 260;
  const MAX_CHAT_WIDTH = 760;
  const MIN_CENTER_WIDTH = 560;

  const isRtl = i18n.language === 'he';
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  const comparisonVehicleIds = Array.from(new Set(comparisons.map((c) => c.vehicleId).filter(Boolean)));
  const vehicleNamesById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v.name])),
    [vehicles]
  );

  useEffect(() => {
    setVisibleOverlayLogIds(comparisons.map((c) => c.id));
  }, [comparisons]);

  const requestInput = useCallback((prompt, defaultValue = '') => {
    return new Promise((resolve) => {
      inputModalResolveRef.current = resolve;
      setInputModal({ open: true, prompt, defaultValue });
    });
  }, []);

  const handleInputConfirm = useCallback((value) => {
    inputModalResolveRef.current?.(value || null);
    inputModalResolveRef.current = null;
    setInputModal({ open: false, prompt: '', defaultValue: '' });
  }, []);

  const handleInputCancel = useCallback(() => {
    inputModalResolveRef.current?.(null);
    inputModalResolveRef.current = null;
    setInputModal({ open: false, prompt: '', defaultValue: '' });
  }, []);

  const handleGoHome = useCallback(() => {
    resetParser();
    setSelectedFields([]);
    setFieldColors({});
    setChatMessages([]);
    setActiveTab('chart');
    setMapMarkers([]);
    setPathColorConfig(null);
    setFieldFeedback(null);
    setCurrentLogName('');
    setActiveLoadedLogId(null);
    setVisibleOverlayLogIds([]);
  }, [resetParser]);

  const handleSaveCommand = useCallback((code, intent) => {
    setSavedCommands((prev) => {
      const next = [...prev, { id: Date.now(), intent, code, savedAt: Date.now() }];
      localStorage.setItem('mapSavedCommands', JSON.stringify(next));
      return next;
    });
  }, []);

  const hasData = fields.length > 0;
  const flightPathData = useFlightPath(fields, getTimeSeries);
  const flightPath = flightPathData?.path ?? null;
  const pathTimes = flightPathData?.times ?? [];
  const pathAltitudes = useMemo(() => {
    if (!pathTimes.length || !fields.length) return null;
    const candidates = ['GPS.Alt', 'CTUN.Alt', 'BARO.Alt', 'CTUN.BarAlt', 'GPS.RelAlt'];
    const altKey = candidates.find((c) => fields.includes(c))
      || fields.find((f) => /\.Alt$/.test(f) || f.endsWith('.RelAlt') || f.endsWith('.BarAlt'));
    if (!altKey) return null;
    const ts = getTimeSeries(altKey);
    if (!ts?.x?.length || !ts?.y?.length) return null;
    const x = ts.x;
    const y = ts.y;
    const out = [];
    for (const t of pathTimes) {
      let lo = 0;
      let hi = x.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (x[mid] < t) lo = mid + 1;
        else hi = mid;
      }
      const i1 = lo;
      const i0 = Math.max(0, i1 - 1);
      const x0 = x[i0];
      const x1 = x[i1];
      const y0 = Number(y[i0]);
      const y1 = Number(y[i1]);
      if (!Number.isFinite(y0) && !Number.isFinite(y1)) {
        out.push(0);
        continue;
      }
      if (!Number.isFinite(y0)) { out.push(y1); continue; }
      if (!Number.isFinite(y1) || x1 === x0) { out.push(y0); continue; }
      const frac = (t - x0) / (x1 - x0);
      out.push(y0 + frac * (y1 - y0));
    }
    return out;
  }, [pathTimes, fields, getTimeSeries]);

  const pathNavHeadingsDeg = useMemo(
    () => buildPathNavHeadingsDeg(pathTimes, fields, getTimeSeries, interpolateSeriesAtTime),
    [pathTimes, fields, getTimeSeries]
  );

  const pathWithValues = usePathWithField(fields, getTimeSeries, pathColorConfig?.field);

  useEffect(() => {
    setSelectedTimeIndex(null);
  }, [flightPath]);

  useEffect(() => {
    if (!apiErrorToast) return;
    const onKey = (e) => { if (e.key === 'Escape') setApiErrorToast(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [apiErrorToast]);

  useEffect(() => {
    try {
      localStorage.setItem('geminiChatWidthPx', String(geminiChatWidthPx));
    } catch {}
  }, [geminiChatWidthPx]);

  useEffect(() => {
    try {
      localStorage.setItem('logListWidthPx', String(logListWidthPx));
    } catch {}
  }, [logListWidthPx]);

  useEffect(() => {
    const el = mainLayoutRef.current;
    if (!el) return undefined;
    const update = () => setMainLayoutWidth(Math.max(0, Math.floor(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const logListMaxPx = useMemo(() => {
    if (!mainLayoutWidth) return MAX_LOG_WIDTH;
    const dynamicMax = mainLayoutWidth - geminiChatWidthPx - MIN_CENTER_WIDTH;
    return Math.max(MIN_LOG_WIDTH, Math.min(MAX_LOG_WIDTH, dynamicMax));
  }, [mainLayoutWidth, geminiChatWidthPx]);

  const geminiChatMaxPx = useMemo(() => {
    if (!mainLayoutWidth) return MAX_CHAT_WIDTH;
    const dynamicMax = mainLayoutWidth - logListWidthPx - MIN_CENTER_WIDTH;
    return Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, dynamicMax));
  }, [mainLayoutWidth, logListWidthPx]);

  useEffect(() => {
    setLogListWidthPx((v) => Math.min(Math.max(v, MIN_LOG_WIDTH), logListMaxPx));
  }, [logListMaxPx]);

  useEffect(() => {
    setGeminiChatWidthPx((v) => Math.min(Math.max(v, MIN_CHAT_WIDTH), geminiChatMaxPx));
  }, [geminiChatMaxPx]);

  const handleLogDeleted = useCallback((deletedId) => {
    setLogSaveCounter((c) => c + 1);
    if (deletedId != null) {
      setActiveLoadedLogId((id) => (id === deletedId ? null : id));
      setVisibleOverlayLogIds((prev) => prev.filter((id) => id !== deletedId));
      removeComparison(deletedId);
    }
  }, [removeComparison]);

  useEffect(() => {
    if (!hasData || !pendingSaveRef.current || !selectedVehicleId) return;
    if (Object.keys(messages).length === 0) return; // wait for parser to finish
    const { arrayBuffer, vehicleId, vehicleName, originalName } = pendingSaveRef.current;
    pendingSaveRef.current = null;
    (async () => {
      const flightDate = extractFlightDate(messages);
      const hasGps = !!flightPath?.length;
      let nearestCity = 'Unknown';
      if (hasGps && flightPath.length) {
        const lat = flightPath.reduce((s, p) => s + p[0], 0) / flightPath.length;
        const lng = flightPath.reduce((s, p) => s + p[1], 0) / flightPath.length;
        nearestCity = await getNearestCity(lat, lng);
      }
      const baseDisplayName = buildLogDisplayName(vehicleName, nearestCity, flightDate, hasGps, 1).replace(/\s+טיסה\s+\d+$/, '');
      const existingLogs = await getLogs(vehicleId);
      const usedNumbers = new Set(
        (existingLogs || [])
          .map((l) => String(l.displayName || ''))
          .filter((name) => name.startsWith(baseDisplayName))
          .map((name) => {
            const m = name.match(/טיסה\s+(\d+)$/);
            return m ? Number(m[1]) : null;
          })
          .filter((n) => Number.isFinite(n))
      );
      let flightNumber = 1;
      while (usedNumbers.has(flightNumber)) flightNumber += 1;
      const displayName = buildLogDisplayName(vehicleName, nearestCity, flightDate, hasGps, flightNumber);
      const saved = await saveLog(vehicleId, arrayBuffer, { displayName, flightDate, nearestCity, originalName });
      setCurrentLogName(displayName);
      setActiveLoadedLogId(saved?.id ?? null);
      setLogSaveCounter((c) => c + 1);
    })();
  }, [hasData, messages, flightPath, selectedVehicleId]);

  const handleLoadLog = useCallback((log) => {
    if (!log?.id) return;
    setCurrentLogName(log.displayName || '');
    setActiveLoadedLogId(log.id);
    (async () => {
      const full = await getLog(log.id);
      if (full?.rawBin) parseFile(full.rawBin);
    })();
  }, [parseFile]);

  const processOneFile = useCallback((arrayBuffer, originalName) => {
    const vehicleName = vehicles.find((v) => v.id === selectedVehicleId)?.name;
    if (selectedVehicleId) {
      // Clone before passing to worker — postMessage with transfer detaches the original buffer
      pendingSaveRef.current = {
        arrayBuffer: arrayBuffer.slice(0),
        vehicleId: selectedVehicleId,
        vehicleName: vehicleName || 'כטב"ם',
        originalName: originalName || null,
      };
    }
    setActiveLoadedLogId(null);
    parseFile(arrayBuffer);
  }, [parseFile, selectedVehicleId, vehicles]);

  const kickUploadQueue = useCallback(() => {
    if (uploadActiveRef.current) return;
    const next = uploadQueueRef.current.shift();
    if (!next) return;
    uploadActiveRef.current = true;
    processOneFile(next.arrayBuffer, next.originalName);
  }, [processOneFile]);

  useEffect(() => {
    if (!loading && uploadActiveRef.current) {
      uploadActiveRef.current = false;
      kickUploadQueue();
    }
  }, [loading, kickUploadQueue]);

  const handleFileSelect = useCallback((arrayBuffer, originalName) => {
    uploadQueueRef.current.push({ arrayBuffer, originalName });
    kickUploadQueue();
  }, [kickUploadQueue]);

  const handleFilesSelect = useCallback(async (files) => {
    for (const file of files || []) {
      const arrayBuffer = await file.arrayBuffer();
      uploadQueueRef.current.push({ arrayBuffer, originalName: file.name });
    }
    kickUploadQueue();
  }, [kickUploadQueue]);

  const handleToggleLogVisibility = useCallback(async (log) => {
    if (!log?.id || log.id === activeLoadedLogId) return;
    const isVisible = comparisons.some((c) => c.id === log.id);
    if (isVisible) {
      removeComparison(log.id);
      setVisibleOverlayLogIds((prev) => prev.filter((id) => id !== log.id));
      return;
    }
    const full = await getLog(log.id);
    if (!full?.rawBin) return;
    addComparison(log.id, selectedVehicle?.name || t('vehicle.newVehicle', 'כטב"ם חדש'), log.displayName || log.originalName || log.id, full.rawBin, log.vehicleId);
    setVisibleOverlayLogIds((prev) => (prev.includes(log.id) ? prev : [...prev, log.id]));
  }, [activeLoadedLogId, comparisons, removeComparison, addComparison, selectedVehicle?.name, t]);

  const handleLoadFrsky = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt,.log,.CSV,.TXT,.LOG';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      setFrskyMap(parseFrskyTable(text));
      setFrskyName(file.name.replace(/\.[^.]+$/, ''));
    };
    input.click();
  }, []);

  const handleChartPresetApply = useCallback((selected, colors) => {
    const matching = (selected || []).filter((f) => fields.includes(f));
    if ((selected || []).length > 0 && matching.length === 0) {
      setFieldFeedback({ presetMismatch: true, suggested: [] });
    } else {
      setFieldFeedback(null);
    }
    setSelectedFields(selected || []);
    setFieldColors(colors || {});
  }, [fields]);

  const handleMapPresetApply = useCallback((config) => {
    setPathColorConfig(config);
  }, []);

  const getTimeSeriesWithSynonyms = useCallback((fieldKey) => {
    let ts = getTimeSeries(fieldKey);
    if (ts) return ts;
    const dot = fieldKey.indexOf('.');
    if (dot === -1) return null;
    const msg = fieldKey.slice(0, dot);
    const field = fieldKey.slice(dot + 1);
    const synonyms = { Press: ['BPrs'], BPrs: ['Press'], Alt: ['BarAlt', 'RelAlt'], BarAlt: ['Alt'], RelAlt: ['Alt'] };
    for (const alt of synonyms[field] || []) {
      ts = getTimeSeries(`${msg}.${alt}`);
      if (ts) return ts;
    }
    return null;
  }, [getTimeSeries]);

  const series = useMemo(() => {
    if (!selectedFields.length) return [];
    return selectedFields.map((key, i) => {
      const ts = getTimeSeriesWithSynonyms(key);
      if (!ts) return null;
      const color = fieldColors[key] || COLORS[i % COLORS.length];
      return { ...ts, color };
    }).filter(Boolean);
  }, [selectedFields, getTimeSeriesWithSynonyms, fieldColors]);

  const comparisonSeries = useMemo(() => {
    if (!selectedFields.length || !comparisons.length) return [];
    const result = [];
    comparisons.forEach((comp, ci) => {
      if (comp.loading) return;
      selectedFields.forEach((key, fi) => {
        const ts = getComparisonTimeSeries(comp.id, key);
        if (!ts) return;
        const color = COMP_COLORS[(fi + ci * 4) % COMP_COLORS.length];
        const legend =
          comp.logName && comp.vehicleName
            ? `${comp.vehicleName} · ${comp.logName}`
            : (comp.logName || comp.vehicleName || '');
        result.push({
          ...ts,
          name: `${key} (${legend})`,
          color,
        });
      });
    });
    return result;
  }, [selectedFields, comparisons, getComparisonTimeSeries]);

  const frskySeries = useMemo(() => {
    if (!selectedFields.length || !frskyMap.size) return [];
    return selectedFields.map((key) => {
      const dot = key.indexOf('.');
      const short = dot > 0 ? key.slice(dot + 1) : key;
      let ts = frskyMap.get(short);
      if (!ts) {
        ts = Array.from(frskyMap.entries()).find(([k]) => k.toLowerCase() === short.toLowerCase())?.[1];
      }
      if (!ts?.x?.length) return null;
      return {
        x: ts.x,
        y: ts.y,
        name: `${key} (FRSKY${frskyName ? ` · ${frskyName}` : ''})`,
        color: '#f59e0b',
      };
    }).filter(Boolean);
  }, [selectedFields, frskyMap, frskyName]);

  const allSeries = useMemo(() => [...series, ...comparisonSeries, ...frskySeries], [series, comparisonSeries, frskySeries]);

  const resolveGeminiField = useCallback((name) => {
    if (!name || !fields?.length) return name;
    if (fields.includes(name)) return name;
    const dot = name.indexOf('.');
    const msg = dot > 0 ? name.slice(0, dot) : '';
    const field = dot > 0 ? name.slice(dot + 1) : name;
    const synonyms = { Press: ['BPrs'], BPrs: ['Press'], Alt: ['BarAlt', 'RelAlt'], BarAlt: ['Alt'], RelAlt: ['Alt'] };
    const alts = [field, ...(synonyms[field] || [])];
    const found = fields.find((f) => {
      const fd = f.indexOf('.');
      const fm = fd > 0 ? f.slice(0, fd) : '';
      const ff = fd > 0 ? f.slice(fd + 1) : f;
      return fm === msg && alts.some((a) => ff === a || ff.toLowerCase() === a.toLowerCase());
    });
    return found || name;
  }, [fields]);

  const handleGraphRequest = useCallback(async (text) => {
    if (fields.length === 0) return;
    setFieldFeedback(null);
    setGraphRequestLoading(true);
    const append = getAppendFromText(text);
    const wantsMultiple = /(\sו\S|,|\/|\band\b|\balso\b|\bplus\b|\badd\b|\bוגם\b|\bבנוסף\b|\bועוד\b)/i.test(text || '');
    const minHint = estimateMinFieldCount(text);
    const allowMulti = wantsMultiple || minHint > 1;

    const mergeLocalFields = (names) => {
      if (!allowMulti || names.length >= minHint) return names;
      const localParsed = parseGraphRequest(text, fields);
      const next = [...names];
      for (const p of localParsed.fields || []) {
        if (next.length >= minHint) break;
        if (fields.includes(p.name) && !next.includes(p.name)) next.push(p.name);
      }
      return next;
    };

    try {
      const { fields: parsedFields } = await parseGraphRequestViaGemini(text, fields);
      const resolved = (parsedFields || []).map((p) => ({ ...p, name: resolveGeminiField(p.name) }));
      const valid = resolved.filter((p) => fields.includes(p.name));
      const finalValid = allowMulti ? valid : valid.slice(0, 1);
      if (finalValid.length > 0) {
        const geminiColorMap = Object.fromEntries(finalValid.map((p) => [p.name, p.color]).filter(([, c]) => c));
        let names = [...new Set(finalValid.map((p) => p.name))];
        names = mergeLocalFields(names);
        const nextSelected = append
          ? [...selectedFields, ...names.filter((n) => !selectedFields.includes(n))]
          : names;
        const nextColors = Object.fromEntries(
          nextSelected.map((name, i) => [name, geminiColorMap[name] || COLORS[i % COLORS.length]])
        );
        setSelectedFields(nextSelected);
        setFieldColors(nextColors);
        return;
      }
      const localParsed = parseGraphRequest(text, fields);
      const { suggested } = localParsed;
      const finalSuggested = allowMulti ? (suggested || []) : (suggested || []).slice(0, 1);
      setFieldFeedback({ suggested: finalSuggested });
    } catch (_) {
      setApiErrorToast(t('apiError.geminiUnavailable'));
      const { fields: parsedFields, notFound, suggested } = parseGraphRequest(text, fields);
      if (parsedFields.length) {
        let finalFields = allowMulti ? parsedFields : parsedFields.slice(0, 1);
        let names = finalFields.map((p) => p.name);
        names = mergeLocalFields(names);
        const nextSelected = append
          ? [...selectedFields, ...names.filter((n) => !selectedFields.includes(n))]
          : names;
        const colorMap = Object.fromEntries(parsedFields.map((p) => [p.name, p.color]));
        const nextColors = Object.fromEntries(
          nextSelected.map((name, i) => [name, colorMap[name] || COLORS[i % COLORS.length]])
        );
        setSelectedFields(nextSelected);
        setFieldColors(nextColors);
      } else if (notFound) {
        const finalSuggested = allowMulti ? (suggested || []) : (suggested || []).slice(0, 1);
        setFieldFeedback({ suggested: finalSuggested });
      }
    } finally {
      setGraphRequestLoading(false);
    }
  }, [fields, t, resolveGeminiField, selectedFields]);

  const resolveField = useCallback((name) => {
    if (!name || !fields?.length) return name;
    if (fields.includes(name)) return name;
    const suffix = name.includes('.') ? name : `.${name}`;
    const found = fields.find((f) => f.endsWith(suffix) || f === name);
    return found || name;
  }, [fields]);

  const executeMapCode = useCallback((code) => {
    if (!code?.trim()) return;
    try {
      const map = mapRef.current;
      const api = {
        setColor:           (color)                          => setPathColorConfig({ solidColor: color }),
        colorByThreshold:   (field, threshold, above, below) => setPathColorConfig({ field: resolveField(field), threshold: Number(threshold), aboveColor: above || '#3fb950', belowColor: below || '#58a6ff' }),
        colorByField:       (field, pos, neg, zero)          => setPathColorConfig({ field: resolveField(field), positiveColor: pos || '#f85149', negativeColor: neg || '#d29922', zeroColor: zero || '#58a6ff' }),
        setSegmentColors:   (colors)                         => setPathColorConfig({ segmentColors: Array.from(colors) }),
        resetColor:         ()                               => setPathColorConfig(null),
        addMarker:          (lat, lng, label)                => setMapMarkers((prev) => [...prev, { lat: Number(lat), lng: Number(lng), label: label || '' }]),
        clearMarkers:       ()                               => setMapMarkers([]),
        setCenter:          (lat, lng)                       => map?.setView([Number(lat), Number(lng)], map.getZoom()),
        setZoom:            (zoom)                           => map?.setZoom(Number(zoom)),
        fitBounds:          (bounds)                         => map?.fitBounds(bounds, { padding: [30, 30] }),
      };
      const data = {
        getValues: (fieldName) => {
          const resolved = resolveField(fieldName);
          const ts = getTimeSeries(resolved);
          if (!ts?.x?.length || !pathTimes?.length) return new Array(pathTimes?.length ?? 0).fill(null);
          const x = ts.x, y = ts.y;
          return pathTimes.map((t) => {
            let lo = 0, hi = x.length - 1;
            while (lo < hi) {
              const mid = (lo + hi) >> 1;
              if (x[mid] < t) lo = mid + 1; else hi = mid;
            }
            const i0 = Math.max(0, lo - 1), i1 = lo;
            const v0 = y[i0], v1 = y[i1];
            if (v0 == null && v1 == null) return null;
            if (v0 == null) return v1;
            if (v1 == null) return v0;
            return Math.abs(x[i0] - t) <= Math.abs(x[i1] - t) ? v0 : v1;
          });
        },
        fieldNames: fields,
        segmentCount: pathTimes?.length ?? 0,
      };
      // eslint-disable-next-line no-new-func
      new Function('api', 'data', code)(api, data);
    } catch (e) {
      console.warn('Map code execution error:', e);
    }
  }, [resolveField, getTimeSeries, fields, pathTimes]);

  const handleTimeSelect = useCallback((timeValue) => {
    if (!pathTimes?.length) return;
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < pathTimes.length; i++) {
      const d = Math.abs(pathTimes[i] - timeValue);
      if (d < bestDiff) { bestDiff = d; bestIdx = i; }
    }
    setSelectedTimeIndex(bestIdx);
    setMapPanRequest({ id: Date.now(), index: bestIdx });
    setActiveTab('map');
  }, [pathTimes]);

  const handleMapTimelineIndex = useCallback((index) => {
    setSelectedTimeIndex(index);
  }, []);

  const handleMarkOnChartFromMap = useCallback((index) => {
    setSelectedTimeIndex(index);
    setActiveTab('chart');
  }, []);

  const handleMapBarCommand = useCallback(async (text) => {
    if (!hasData || mapChatLoading) return;
    const userMsg = { role: 'user', text };
    const snapshot = [...chatMessages, userMsg];
    setChatMessages(snapshot);
    setMapChatLoading(true);
    try {
      const map = mapRef?.current;
      const mapView = (() => {
        if (!map) return null;
        try { const c = map.getCenter(); return { center: [c.lat, c.lng], zoom: map.getZoom() }; }
        catch { return null; }
      })();
      const context = buildChatContext(fields, selectedFields, getTimeSeries, messages);
      const allMessages = snapshot.map((m) => ({ role: m.role, text: m.text }));
      const currentMapState = { pathColorConfig, mapView };
      const { text: reply, code, intent } = await sendUnifiedChatMessage(
        allMessages, context, flightPath, mapView, fields, currentMapState, savedCommands
      );
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply || t('chat.errorEmpty'), code: code || null, intent: intent || null }]);
      if (code) executeMapCode(code);
    } catch {
      setApiErrorToast(t('apiError.geminiUnavailable'));
      setChatMessages((prev) => [...prev, { role: 'assistant', text: t('apiError.geminiUnavailable'), error: true }]);
    } finally {
      setMapChatLoading(false);
    }
  }, [hasData, flightPath, fields, selectedFields, getTimeSeries, chatMessages, pathColorConfig, executeMapCode, t, savedCommands]);

  return (
    <div
      className={`h-[100dvh] flex flex-col overflow-hidden ${!hasData ? 'bg-figmaBg text-gray-200' : 'bg-surface text-gray-200'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {!hasData ? (
        <>
          {/* Landing header — no + button */}
          <header className="shrink-0 min-h-16 flex items-center justify-between px-5 py-3 bg-figmaBg border-b border-white/[0.08] gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                className={`text-sm font-medium transition-colors rounded-md px-2 py-1 ${
                  i18n.language === 'en'
                    ? 'bg-figmaAccent text-white px-3 py-1.5'
                    : 'text-white/55 hover:text-white bg-transparent'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('he')}
                className={`text-sm font-medium transition-colors rounded-md px-2 py-1 ${
                  i18n.language === 'he'
                    ? 'bg-figmaAccent text-white px-3 py-1.5'
                    : 'text-white/55 hover:text-white bg-transparent'
                }`}
              >
                עברית
              </button>
            </div>
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0 min-w-0 text-end">
                <h1 className="text-base font-semibold tracking-tight text-white leading-snug whitespace-nowrap">
                  {t('appTitle')}{' '}
                  <span
                    className="text-white/90 font-normal cursor-pointer hover:underline decoration-white/40"
                    onClick={() => setVersionPopupOpen((o) => !o)}
                    title={t('version.whatsNew', 'מה חדש')}
                  >
                    v{APP_VERSION}
                  </span>
                </h1>
                {versionPopupOpen && (
                  <>
                    <span className="fixed inset-0 z-[9998]" onClick={() => setVersionPopupOpen(false)} aria-hidden />
                    <span
                      className="fixed z-[9999] px-3 py-2 rounded-lg bg-surfaceRaised border border-border shadow-xl text-sm text-gray-300 max-w-sm mt-1 whitespace-pre-line"
                      style={{ top: 64, [isRtl ? 'right' : 'left']: 16 }}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      {VERSION_WHATS_NEW[i18n.language] || VERSION_WHATS_NEW.he}
                    </span>
                  </>
                )}
              </div>
            </div>
          </header>
          <LandingScreen
            vehicleGridRef={vehicleGridRef}
            onFile={handleFileSelect}
            onFiles={handleFilesSelect}
            loading={loading}
            progress={progress}
            error={error}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
            onVehiclesChange={setVehicles}
            vehicles={vehicles}
            onLoadLog={handleLoadLog}
            onPrompt={requestInput}
          />
        </>
      ) : (
        <>
          {/* Main app header: Logo (left) | Tabs (center) | Upload + Language (right) */}
          <header className="shrink-0 h-14 flex items-center px-4 bg-surfaceRaised border-b border-border relative">
            {/* Left: logo + title (clickable → home) */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              <button
                type="button"
                onClick={handleGoHome}
                title={t('app.goHome')}
                className="shrink-0 rounded hover:opacity-75 transition-opacity"
              >
                <img src="/logo.svg" alt="logo" className="h-14 w-14 rounded-lg" />
              </button>
              <div className="shrink-0">
                <h1 className="text-sm font-semibold text-accent leading-tight whitespace-nowrap">
                  {t('appTitle')}{' '}
                  <span
                    className="text-gray-500 text-xs font-normal cursor-pointer hover:text-accent hover:underline"
                    onClick={() => setVersionPopupOpen((o) => !o)}
                    title={t('version.whatsNew', 'מה חדש')}
                  >
                    v{APP_VERSION}
                  </span>
                </h1>
                {versionPopupOpen && (
                  <>
                    <span className="fixed inset-0 z-[9998]" onClick={() => setVersionPopupOpen(false)} aria-hidden />
                    <span
                      className="fixed z-[9999] px-3 py-2 rounded-lg bg-surfaceRaised border border-border shadow-xl text-sm text-gray-300 max-w-sm mt-1 whitespace-pre-line"
                      style={{ top: 56, [isRtl ? 'right' : 'left']: 16 }}
                      dir={isRtl ? 'rtl' : 'ltr'}
                    >
                      {VERSION_WHATS_NEW[i18n.language] || VERSION_WHATS_NEW.he}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Center: tabs — absolutely centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
              {['chart', 'map', 'reports'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300 hover:bg-surface/60'
                  }`}
                >
                  {tab === 'chart' ? t('chart.tab', 'גרף') : tab === 'map' ? t('map.tab', 'מפה') : t('reports.tab', 'הפק דוחות')}
                </button>
              ))}
            </div>

            {/* Right: upload + language */}
            <div className="flex items-center gap-2 shrink-0 ms-auto z-10">
              <label className="text-sm px-3 py-1.5 rounded-lg bg-surface border border-border cursor-pointer hover:border-accent/50 text-gray-300 transition-colors whitespace-nowrap">
                {t('dropZone.newFile')}
                <input
                  type="file"
                  accept=".bin,.BIN"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    handleFilesSelect(files);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('he')}
                className={`px-2 py-1 rounded text-sm ${i18n.language === 'he' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300'}`}
              >
                עברית
              </button>
              <button
                type="button"
                onClick={() => i18n.changeLanguage('en')}
                className={`px-2 py-1 rounded text-sm ${i18n.language === 'en' ? 'bg-accent/20 text-accent' : 'text-gray-500 hover:text-gray-300'}`}
              >
                English
              </button>
            </div>
          </header>

          <div ref={mainLayoutRef} className="flex-1 flex min-h-0">
            <aside className="flex shrink-0 border-e border-border min-h-0">
              <div
                className="shrink-0 flex flex-col bg-surfaceRaised min-h-0 min-w-[160px]"
                style={{ width: logListWidthPx }}
              >
                <div className="shrink-0 px-2 py-1 border-b border-border/80">
                  <input
                    type="range"
                    min={MIN_LOG_WIDTH}
                    max={Math.max(MIN_LOG_WIDTH, logListMaxPx)}
                    step={4}
                    value={logListWidthPx}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setLogListWidthPx(Math.min(Math.max(v, MIN_LOG_WIDTH), logListMaxPx));
                    }}
                    className="w-full h-2 accent-accent cursor-pointer opacity-90"
                    aria-label={t('logs.columnWidth', 'רוחב עמודת לוגים')}
                    title={t('logs.columnWidth', 'רוחב עמודת לוגים')}
                  />
                </div>
                <LogList
                  vehicleId={selectedVehicleId}
                  onLoad={handleLoadLog}
                  disabled={loading}
                  refreshKey={logSaveCounter}
                  onPrompt={requestInput}
                  onLogDeleted={handleLogDeleted}
                  visibleLogIds={visibleOverlayLogIds}
                  onToggleVisibility={handleToggleLogVisibility}
                  mainLogId={activeLoadedLogId}
                  extraVehicleIds={comparisonVehicleIds}
                  vehicleNamesById={vehicleNamesById}
                />
                {/* Vehicle mini-card + compare button pinned at the bottom of the logs column */}
                <div className="shrink min-h-0 border-t border-border flex flex-col bg-surfaceRaised/60">
                    <div className="p-2 flex flex-col gap-1.5 overflow-y-auto min-h-0 max-h-[45vh]">
                      <VehicleMiniCard vehicle={selectedVehicle} onClick={() => setShowVehiclePicker(true)} />
                  {showVehiclePicker && (
                    <div
                      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/65"
                      onClick={() => setShowVehiclePicker(false)}
                      role="presentation"
                    >
                      <div
                        className="w-full max-w-sm max-h-[min(70vh,400px)] rounded-xl bg-surfaceRaised border border-border shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-accent">{t('vehicle.select')}</h3>
                          <button
                            type="button"
                            onClick={() => setShowVehiclePicker(false)}
                            className="text-gray-400 hover:text-gray-100 px-2 py-1 rounded-lg hover:bg-surface text-lg leading-none"
                            aria-label={t('landing.closePicker')}
                          >
                            ✕
                          </button>
                        </div>
                        <ul className="py-2 overflow-y-auto flex-1 min-h-0">
                          {vehicles.map((v) => (
                            <li key={v.id}>
                              <button
                                type="button"
                                onClick={() => { setSelectedVehicleId(v.id); setShowVehiclePicker(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-start ${
                                  v.id === selectedVehicleId ? 'text-accent bg-accent/10' : 'text-gray-200 hover:bg-surface'
                                }`}
                              >
                                {v.photo ? (
                                  <img src={v.photo} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border" />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-sm border border-border">✈</div>
                                )}
                                <span className="truncate font-medium">{v.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  <ComparisonSelector
                    vehicles={vehicles}
                    selectedVehicleId={selectedVehicleId}
                    comparisons={comparisons}
                    onAdd={addComparison}
                    onRemove={removeComparison}
                  />
                  <FlightLogsCompareSelector
                    vehicleId={selectedVehicleId}
                    vehicleName={selectedVehicle?.name}
                    primaryLogId={activeLoadedLogId}
                    comparisons={comparisons}
                    onAdd={addComparison}
                  />
                  <button
                    type="button"
                    onClick={handleLoadFrsky}
                    className="flex items-center justify-center gap-2 w-full min-h-[52px] px-3 py-2 rounded-xl bg-surfaceRaised border border-border text-sm text-gray-200 hover:border-amber-400/60 hover:text-amber-200 transition-all shadow-sm"
                    title={isRtl ? 'העלה לוג FrSky להצלבה' : 'Load FrSky log for overlay'}
                  >
                    <span className="text-amber-300 font-semibold">FRSKY</span>
                    <span className="truncate">{isRtl ? 'הצלבת לוג שלט' : 'Overlay radio log'}</span>
                  </button>
                    </div>
                </div>
              </div>
              <FieldsSidebar
                fields={fields}
                selected={selectedFields}
                onChange={setSelectedFields}
                defaultCollapsed={true}
              />
            </aside>

            {/* Center column: presets → chart/map/reports → feedback → request bar */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {activeTab !== 'reports' && (
                <div className="shrink-0 px-3 py-1.5 flex items-center gap-2 border-b border-border bg-surfaceRaised">
                  {activeTab === 'chart' ? (
                    <ChartPresetManager
                      selectedFields={selectedFields}
                      fieldColors={fieldColors}
                      onApply={handleChartPresetApply}
                    />
                  ) : (
                    <MapPresetManager
                      pathColorConfig={pathColorConfig}
                      onApply={handleMapPresetApply}
                    />
                  )}
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {activeTab === 'chart' && (
                  <ChartPanel
                    series={allSeries}
                    onTimeSelect={pathTimes?.length ? handleTimeSelect : undefined}
                    selectedTime={selectedTimeIndex != null && pathTimes?.[selectedTimeIndex] != null ? pathTimes[selectedTimeIndex] : null}
                  />
                )}
                {activeTab === 'map' && (
                  <MapPanel
                    path={flightPath}
                    markers={mapMarkers}
                    pathColorConfig={pathColorConfig}
                    pathWithValues={pathWithValues}
                    pathAltitudes={pathAltitudes}
                    pathNavHeadingsDeg={pathNavHeadingsDeg}
                    pathName={currentLogName || 'flight-path'}
                    onResetPathColor={() => setPathColorConfig(null)}
                    selectedTimeIndex={selectedTimeIndex}
                    panToIndexRequest={mapPanRequest}
                    onTimelineIndexChange={handleMapTimelineIndex}
                    onMarkOnChart={handleMarkOnChartFromMap}
                    onMapReady={(map) => { mapRef.current = map; }}
                  />
                )}
                {activeTab === 'reports' && (
                  <ReportsPanel
                    fields={fields}
                    selectedFields={selectedFields}
                    getTimeSeries={getTimeSeries}
                    logDisplayName={currentLogName}
                    messages={messages}
                  />
                )}
              </div>

              {fieldFeedback && activeTab !== 'reports' && (
                <div className="shrink-0 px-4 py-2 bg-amber-500/20 border-t border-amber-500/30 text-amber-200 text-sm flex items-start justify-between gap-2">
                  <div>
                    {fieldFeedback.presetMismatch ? (
                      <p>{t('preset.noFieldsMatch', 'הפריסט לא תואם ללוג הנוכחי')}</p>
                    ) : (
                      <>
                        <p>{t('fieldNotFound.message')}</p>
                        {(fieldFeedback.suggested?.length ?? 0) > 0 ? (
                          <p className="mt-1 text-amber-300/90">
                            {t('fieldNotFound.suggest')}{' '}
                            {(fieldFeedback.suggested || []).map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => {
                                  const nextSelected = [...selectedFields.filter((x) => x !== f), f];
                                  const nextColors = Object.fromEntries(nextSelected.map((name, i) => [name, COLORS[i % COLORS.length]]));
                                  setSelectedFields(nextSelected);
                                  setFieldColors(nextColors);
                                  setFieldFeedback(null);
                                }}
                                className="underline hover:no-underline mr-2"
                              >
                                {getFieldLabel(f, i18n.language)}
                              </button>
                            ))}
                          </p>
                        ) : (
                          <p className="mt-1 text-amber-300/90">{t('fieldNotFound.noSimilar')}</p>
                        )}
                      </>
                    )}
                  </div>
                  <button type="button" onClick={() => setFieldFeedback(null)} className="text-amber-400 hover:text-amber-200 shrink-0">✕</button>
                </div>
              )}

              {activeTab !== 'reports' && (
                <div className="shrink-0 border-t border-border">
                  <RequestBar
                    onRequest={activeTab === 'chart' ? handleGraphRequest : handleMapBarCommand}
                    disabled={!hasData}
                    loading={activeTab === 'chart' ? graphRequestLoading : mapChatLoading}
                    placeholder={activeTab === 'chart' ? t('graphRequest.placeholder') : t('map.chatPlaceholder')}
                  />
                </div>
              )}
            </div>

            <ChatPanel
              fields={fields}
              logMessages={messages}
              selectedFields={selectedFields}
              getTimeSeries={getTimeSeries}
              activeTab={activeTab}
              messages={chatMessages}
              onMessages={setChatMessages}
              onMapCommand={executeMapCode}
              onSaveCommand={handleSaveCommand}
              widthPx={geminiChatWidthPx}
              onWidthPxChange={(v) => setGeminiChatWidthPx(Math.min(Math.max(v, MIN_CHAT_WIDTH), geminiChatMaxPx))}
              widthMinPx={MIN_CHAT_WIDTH}
              widthMaxPx={geminiChatMaxPx}
            />
          </div>
        </>
      )}

      <InputModal
        open={inputModal.open}
        prompt={inputModal.prompt}
        defaultValue={inputModal.defaultValue}
        onConfirm={handleInputConfirm}
        onCancel={handleInputCancel}
      />

      {apiErrorToast && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40"
          onClick={() => setApiErrorToast(null)}
          role="button"
          tabIndex={0}
          aria-label={t('apiError.clickToDismiss')}
        >
          <div className="px-6 py-4 rounded-lg bg-amber-500 text-amber-950 shadow-xl max-w-sm" role="alert">
            <p className="font-medium">{apiErrorToast}</p>
            <p className="text-sm mt-1 opacity-90">{t('apiError.clickToDismiss')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
