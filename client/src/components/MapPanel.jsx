import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import Plot from 'react-plotly.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function FitBounds({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path?.length) {
      map.fitBounds(path, { padding: [30, 30] });
    }
  }, [map, path]);
  return null;
}

function MapController({ onReady }) {
  const map = useMap();
  useEffect(() => {
    if (onReady) onReady(map);
    return () => { if (onReady) onReady(null); };
  }, [map, onReady]);
  return null;
}

function getSegmentColor(value, config) {
  if (config == null || value == null || isNaN(value)) return '#58a6ff';
  const v = Number(value);
  if (config.threshold != null) {
    return v > config.threshold ? (config.aboveColor ?? '#3fb950') : (config.belowColor ?? '#58a6ff');
  }
  if (v > 0) return config.positiveColor ?? '#f85149';
  if (v < 0) return config.negativeColor ?? '#d29922';
  return config.zeroColor ?? '#58a6ff';
}

function CenterOnIndex({ path, index }) {
  const map = useMap();
  useEffect(() => {
    if (path?.length && index != null && index >= 0 && index < path.length) {
      map.setView(path[index], map.getZoom(), { animate: true });
    }
  }, [map, path, index]);
  return null;
}

function kmlColor(hex) {
  const clean = String(hex || '#58a6ff').replace('#', '');
  const r = clean.slice(0, 2) || '58';
  const g = clean.slice(2, 4) || 'a6';
  const b = clean.slice(4, 6) || 'ff';
  return `ff${b}${g}${r}`; // aabbggrr
}

function buildPathKml(path, altitudes = [], name = 'flight-path', color = '#58a6ff') {
  const coords = path
    .map((p, i) => `${Number(p[1]).toFixed(7)},${Number(p[0]).toFixed(7)},${Number(altitudes[i] ?? 0).toFixed(2)}`)
    .join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${String(name).replace(/[<>]/g, '')}</name>
    <Style id="flightLine">
      <LineStyle>
        <color>${kmlColor(color)}</color>
        <width>3</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${String(name).replace(/[<>]/g, '')}</name>
      <styleUrl>#flightLine</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>${coords}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
}

/**
 * Navigation heading (0°=N, 90°=E, CW from north) → CSS rotate() for an icon drawn nose to +x (east).
 * Math.atan2(dlat, dlng) uses CCW from +x; screen CSS rotate is CW from +x with y-down, so we use (nav - 90).
 */
function navHeadingToMapRotationDeg(navDeg) {
  if (navDeg == null || !Number.isFinite(navDeg)) return null;
  return navDeg - 90;
}

/** Tangent direction at path[index]: average incoming + outgoing segment; CSS rotate degrees */
function bearingFromPathPoints(path, index) {
  if (!path?.length) return 0;
  const n = path.length;
  let dy = 0;
  let dx = 0;
  if (index > 0) {
    dy += Number(path[index][0]) - Number(path[index - 1][0]);
    dx += Number(path[index][1]) - Number(path[index - 1][1]);
  }
  if (index < n - 1) {
    dy += Number(path[index + 1][0]) - Number(path[index][0]);
    dx += Number(path[index + 1][1]) - Number(path[index][1]);
  }
  if (dx === 0 && dy === 0) {
    for (let step = 2; step < n && dx === 0 && dy === 0; step += 1) {
      if (index + step < n) {
        dy = Number(path[index + step][0]) - Number(path[index][0]);
        dx = Number(path[index + step][1]) - Number(path[index][1]);
      }
      if (dx === 0 && dy === 0 && index - step >= 0) {
        dy = Number(path[index][0]) - Number(path[index - step][0]);
        dx = Number(path[index][1]) - Number(path[index - step][1]);
      }
    }
  }
  if (dx === 0 && dy === 0) return 0;
  const mathDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return -mathDeg;
}

/** Top-view cute craft, nose toward +x (east) before rotation */
function aircraftSvgHtml(variant) {
  const shadow = 'filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))';
  if (variant === 'quad') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-26 -26 52 52" width="50" height="50" style="${shadow}" aria-hidden="true"><g stroke-linejoin="round"><line x1="0" y1="0" x2="-13" y2="-13" stroke="#d473a3" stroke-width="1.5"/><line x1="0" y1="0" x2="13" y2="-13" stroke="#d473a3" stroke-width="1.5"/><line x1="0" y1="0" x2="-13" y2="13" stroke="#d473a3" stroke-width="1.5"/><line x1="0" y1="0" x2="13" y2="13" stroke="#d473a3" stroke-width="1.5"/><circle cx="-13" cy="-13" r="5.5" fill="#ffd6e8" stroke="#e84d8b" stroke-width="1.2"/><circle cx="13" cy="-13" r="5.5" fill="#ffd6e8" stroke="#e84d8b" stroke-width="1.2"/><circle cx="-13" cy="13" r="5.5" fill="#ffd6e8" stroke="#e84d8b" stroke-width="1.2"/><circle cx="13" cy="13" r="5.5" fill="#ffd6e8" stroke="#e84d8b" stroke-width="1.2"/><rect x="-7" y="-7" width="14" height="14" rx="3.5" fill="#fff5eb" stroke="#e8b896" stroke-width="1.4"/><circle cx="-2.5" cy="-2" r="1.6" fill="#2d2d2d"/><circle cx="2.5" cy="-2" r="1.6" fill="#2d2d2d"/><circle cx="-1.8" cy="-2.6" r="0.55" fill="#fff"/><circle cx="3.2" cy="-2.6" r="0.55" fill="#fff"/><path d="M-2 3q2.5 2.5 5 0" fill="none" stroke="#c97b63" stroke-width="1" stroke-linecap="round"/></g></svg>`;
  }
  /* kawaii plane blob */
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -24 60 48" width="54" height="44" style="${shadow}" aria-hidden="true"><g stroke-linejoin="round"><ellipse cx="2" cy="0" rx="7" ry="19" fill="#ff9ec7" stroke="#e84d8b" stroke-width="1.3"/><ellipse cx="4" cy="0" rx="21" ry="12" fill="#fff5eb" stroke="#e8b896" stroke-width="1.5"/><circle cx="-5" cy="3" r="3.2" fill="#ffb6c9" opacity="0.7"/><circle cx="13" cy="3" r="3.2" fill="#ffb6c9" opacity="0.7"/><circle cx="-1" cy="-3" r="3" fill="#2d2d2d"/><circle cx="9" cy="-3" r="3" fill="#2d2d2d"/><circle cx="0.2" cy="-4.2" r="1" fill="#fff"/><circle cx="10.2" cy="-4.2" r="1" fill="#fff"/><path d="M2 5q6 5 12 2" fill="none" stroke="#c97b63" stroke-width="1.3" stroke-linecap="round"/></g></svg>`;
}

function legendRows(config, t, pathSegments = []) {
  if (!config) {
    return [{ color: '#58a6ff', label: t('map.legendDefault', 'Default path') }];
  }
  if (config.solidColor) {
    return [{ color: config.solidColor, label: t('map.legendSolid', 'Fixed color') }];
  }
  if (config.segmentColors) {
    const seen = new Set();
    const unique = [];
    for (const seg of pathSegments) {
      const c = seg?.color || '#58a6ff';
      if (seen.has(c)) continue;
      seen.add(c);
      unique.push(c);
      if (unique.length >= 4) break;
    }
    if (!unique.length) unique.push('#58a6ff');
    return unique.map((c, idx) => ({
      color: c,
      label: idx === 0
        ? t('map.legendSegments', 'Custom segment colors')
        : `${t('map.legendSegmentN', 'Segment')} ${idx + 1}`,
    }));
  }
  if (config.threshold != null) {
    return [
      { color: config.aboveColor || '#3fb950', label: `${t('map.legendAbove', 'Above')} ${config.threshold}` },
      { color: config.belowColor || '#58a6ff', label: `${t('map.legendBelowEq', 'Below or equal')} ${config.threshold}` },
    ];
  }
  return [
    { color: config.positiveColor || '#f85149', label: t('map.legendPositive', 'Value > 0') },
    { color: config.zeroColor || '#58a6ff', label: t('map.legendZero', 'Value = 0') },
    { color: config.negativeColor || '#d29922', label: t('map.legendNegative', 'Value < 0') },
  ];
}

export function MapPanel({
  path,
  onMapReady,
  markers = [],
  pathColorConfig,
  pathWithValues,
  pathAltitudes = null,
  pathNavHeadingsDeg = null,
  pathName = 'flight-path',
  aircraftModel = 'fixed',
  onResetPathColor,
  selectedTimeIndex,
  panToIndexRequest = null,
  onTimelineIndexChange,
  onMarkOnChart,
}) {
  const { t, i18n } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);
  const [viewMode, setViewMode] = useState('2d');
  const [timelineIndex, setTimelineIndex] = useState(0);
  const timelineRafRef = useRef(null);
  const pendingTimelineParentIdx = useRef(null);
  const onTimelineParentRef = useRef(onTimelineIndexChange);
  onTimelineParentRef.current = onTimelineIndexChange;

  useEffect(() => {
    if (selectedTimeIndex == null) return;
    setTimelineIndex(selectedTimeIndex);
  }, [selectedTimeIndex]);

  useEffect(() => () => {
    if (timelineRafRef.current != null) {
      cancelAnimationFrame(timelineRafRef.current);
      timelineRafRef.current = null;
    }
  }, []);

  const queueTimelineParentSync = (idx) => {
    pendingTimelineParentIdx.current = idx;
    if (timelineRafRef.current != null) return;
    timelineRafRef.current = requestAnimationFrame(() => {
      timelineRafRef.current = null;
      const v = pendingTimelineParentIdx.current;
      if (v != null) onTimelineParentRef.current?.(v);
    });
  };

  const pathSegments = useMemo(() => {
    if (!path?.length) return null;
    if (pathColorConfig?.solidColor) {
      return [{ positions: path, color: pathColorConfig.solidColor }];
    }
    const p = pathWithValues?.path ?? path;
    if (pathColorConfig?.segmentColors) {
      const colors = pathColorConfig.segmentColors;
      return p.slice(0, -1).map((pt, i) => ({
        positions: [pt, p[i + 1]],
        color: colors[i] || '#58a6ff',
      }));
    }
    const values = pathWithValues?.values;
    const hasColorConfig = pathColorConfig && (pathColorConfig.field != null);
    const segs = [];
    for (let i = 0; i < p.length - 1; i++) {
      const color = hasColorConfig && values
        ? getSegmentColor(values[i] != null ? values[i] : values[i + 1], pathColorConfig)
        : '#58a6ff';
      segs.push({ positions: [p[i], p[i + 1]], color });
    }
    return segs.length ? segs : [{ positions: path, color: '#58a6ff' }];
  }, [path, pathColorConfig, pathWithValues]);

  if (!path?.length) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surfaceRaised rounded-lg border border-border">
        <p className="text-gray-500">{t('map.noGps')}</p>
      </div>
    );
  }

  const center = path[Math.floor(path.length / 2)] || [32, 35];
  const legend = legendRows(pathColorConfig, t, pathSegments || []);
  const legendTitle = pathColorConfig?.field
    ? `${t('map.legendByField', 'Color by')} ${pathColorConfig.field}`
    : t('map.legendTitle', 'Path legend');
  const primaryColor = pathColorConfig?.solidColor
    || pathColorConfig?.aboveColor
    || pathColorConfig?.positiveColor
    || '#58a6ff';

  const handleOpenGoogleEarth3D = () => {
    const kml = buildPathKml(path, pathAltitudes || [], pathName, primaryColor);
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${String(pathName || 'flight-path').replace(/[/\\?%*:|"<>]/g, '-')}.kml`;
    a.click();
    URL.revokeObjectURL(url);
    window.open('https://earth.google.com/web/', '_blank', 'noopener,noreferrer');
  };

  const trace3D = useMemo(() => {
    const lat = [];
    const lng = [];
    const alt = [];
    for (let i = 0; i < path.length; i += 1) {
      lat.push(Number(path[i][0]));
      lng.push(Number(path[i][1]));
      alt.push(Number(pathAltitudes?.[i] ?? 0));
    }
    return [{
      type: 'scatter3d',
      mode: 'lines',
      x: lng,
      y: lat,
      z: alt,
      line: {
        width: 5,
        color: pathColorConfig?.solidColor || '#58a6ff',
      },
      name: t('map.flightPath3d', 'Flight path'),
      hovertemplate: 'Lat %{y:.6f}<br>Lon %{x:.6f}<br>Alt %{z:.1f}m<extra></extra>',
    }];
  }, [path, pathAltitudes, pathColorConfig?.solidColor, t]);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contextMenu]);

  useEffect(() => {
    if (!path?.length) setContextMenu(null);
  }, [path?.length]);

  const clampedIndex = useMemo(() => {
    if (!path?.length) return 0;
    const idx = Number.isFinite(timelineIndex) ? timelineIndex : 0;
    return Math.max(0, Math.min(path.length - 1, idx));
  }, [timelineIndex, path]);

  const aircraftRotationDeg = useMemo(() => {
    const nav = pathNavHeadingsDeg?.[clampedIndex];
    const fromLog = navHeadingToMapRotationDeg(nav);
    return fromLog != null ? fromLog : bearingFromPathPoints(path, clampedIndex);
  }, [path, clampedIndex, pathNavHeadingsDeg]);

  const airplane2DIcon = useMemo(() => {
    const angle = aircraftRotationDeg;
    const inner = aircraftSvgHtml(aircraftModel);
    const w = aircraftModel === 'quad' ? 50 : 54;
    const h = aircraftModel === 'quad' ? 50 : 44;
    return L.divIcon({
      className: 'airplane-time-marker',
      html: `<div style="width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;"><div style="transform:rotate(${angle}deg);transform-origin:center center;display:flex;align-items:center;justify-content:center;width:${w}px;height:${h}px;">${inner}</div></div>`,
      iconSize: [w, h],
      iconAnchor: [Math.round(w / 2), Math.round(h / 2)],
    });
  }, [aircraftRotationDeg, aircraftModel]);

  const cursor3DTrace = useMemo(() => {
    const p = path?.[clampedIndex];
    if (!p) return [];
    const z = Number(pathAltitudes?.[clampedIndex] ?? 0);
    return [{
      type: 'scatter3d',
      mode: 'markers',
      x: [Number(p[1])],
      y: [Number(p[0])],
      z: [z],
      marker: { size: 12, color: '#ffb3d9', line: { color: '#c2185b', width: 1 }, symbol: 'circle' },
      hovertemplate: 'Lat %{y:.6f}<br>Lon %{x:.6f}<br>Alt %{z:.1f}m<extra></extra>',
      showlegend: false,
    }];
  }, [path, pathAltitudes, clampedIndex]);

  return (
    <div className="relative flex-1 min-h-0 rounded-lg border border-border overflow-hidden">
      <div className={`absolute inset-0 z-0 min-h-0 ${contextMenu ? 'pointer-events-none' : ''}`}>
      {viewMode === '2d' ? (
        <MapContainer
          center={center}
          zoom={14}
          className="w-full h-full"
        >
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {pathSegments?.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg.positions}
              pathOptions={{ color: seg.color, weight: 4 }}
              eventHandlers={onMarkOnChart ? {
                contextmenu: (e) => {
                  L.DomEvent.preventDefault(e);
                  setContextMenu({ index: i, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                }
              } : undefined}
            />
          ))}
          {markers.map((m, i) => (
            <Marker key={i} position={[m.lat, m.lng]}>
              {m.label && <Popup>{m.label}</Popup>}
            </Marker>
          ))}
          {selectedTimeIndex != null && path?.[selectedTimeIndex] && (
            <Marker
              position={path[selectedTimeIndex]}
              zIndexOffset={1000}
              icon={L.divIcon({
                className: 'time-sync-marker',
                html: '<div style="width:16px;height:16px;border-radius:50%;background:#58a6ff;border:3px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            >
              <Popup>{t('map.syncPoint', 'נקודה נבחרת')}</Popup>
            </Marker>
          )}
          {path?.[clampedIndex] && (
            <Marker
              position={path[clampedIndex]}
              zIndexOffset={1100}
              icon={airplane2DIcon}
            >
              <Popup>{t('map.aircraftNow', 'מיקום מטוס')}</Popup>
            </Marker>
          )}
          <FitBounds path={path} />
          <PanToIndexWhenRequested path={path} request={panToIndexRequest} />
          {onMapReady && <MapController onReady={onMapReady} />}
        </MapContainer>
      ) : (
        <div className="w-full h-full bg-surface">
          <Plot
            data={[...trace3D, ...cursor3DTrace]}
            layout={{
              margin: { l: 0, r: 0, t: 0, b: 0 },
              paper_bgcolor: '#0d1117',
              plot_bgcolor: '#0d1117',
              scene: {
                bgcolor: '#0d1117',
                xaxis: { title: 'Lon', color: '#8b949e', gridcolor: '#30363d' },
                yaxis: { title: 'Lat', color: '#8b949e', gridcolor: '#30363d' },
                zaxis: { title: 'Alt (m)', color: '#8b949e', gridcolor: '#30363d' },
                camera: { eye: { x: 1.6, y: -1.6, z: 1.2 } },
              },
              showlegend: false,
            }}
            config={{ responsive: true, displaylogo: false }}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        </div>
      )}
      </div>
      <div className="absolute top-2 right-2 z-[500]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === '2d' ? '3d' : '2d'))}
            className="px-2.5 py-1.5 rounded-md bg-surfaceRaised/95 border border-border text-xs text-gray-100 hover:border-accent/60 hover:text-accent shadow"
            title={t('map.toggle3DHint', 'Switch between 2D map and in-app 3D view')}
          >
            {viewMode === '2d' ? t('map.view3DInApp', '3D in app') : t('map.view2DInApp', '2D map')}
          </button>
        <button
          type="button"
          onClick={handleOpenGoogleEarth3D}
          className="px-2.5 py-1.5 rounded-md bg-surfaceRaised/95 border border-border text-xs text-gray-100 hover:border-accent/60 hover:text-accent shadow"
          title={t('map.open3DHint', 'Download KML and open Google Earth Web')}
        >
          {t('map.open3D', '3D / Google Earth')}
        </button>
        </div>
      </div>
      <div className="absolute bottom-2 left-2 z-[500] max-w-[240px] rounded-md bg-surfaceRaised/95 border border-border px-2 py-1.5 shadow">
        <div className="text-[11px] text-accent font-medium truncate">{legendTitle}</div>
        <div className="mt-1 space-y-1">
          {legend.map((row, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-gray-200">
              <span className="inline-block w-4 h-[3px] rounded-full" style={{ background: row.color }} />
              <span className="truncate">{row.label}</span>
            </div>
          ))}
        </div>
        {pathColorConfig && (
          <button
            type="button"
            onClick={() => onResetPathColor?.()}
            className="mt-1 w-full text-[11px] text-gray-300 hover:text-accent border border-border rounded px-1 py-0.5"
          >
            {t('map.legendReset', 'Reset colors')}
          </button>
        )}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[500] w-[min(560px,75%)] rounded-md bg-surfaceRaised/95 border border-border px-2 py-1.5 shadow">
        <div className="text-[11px] text-gray-300 mb-1">
          {t('map.timeline', 'ציר זמן')} {clampedIndex + 1}/{path.length}
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, path.length - 1)}
          step={1}
          value={clampedIndex}
          onChange={(e) => {
            const idx = Number(e.target.value);
            setTimelineIndex(idx);
            queueTimelineParentSync(idx);
          }}
          onPointerUp={(e) => {
            if (timelineRafRef.current != null) {
              cancelAnimationFrame(timelineRafRef.current);
              timelineRafRef.current = null;
            }
            const idx = Number(e.currentTarget.value);
            pendingTimelineParentIdx.current = idx;
            onTimelineParentRef.current?.(idx);
          }}
          className="w-full h-2 accent-accent cursor-pointer"
          aria-label={t('map.timeline', 'ציר זמן')}
        />
      </div>
      {contextMenu && (
        <>
          {/* Above Leaflet panes (~700); scoped to map card only (not viewport fixed). */}
          <div
            className="absolute inset-0 z-[8000] bg-transparent"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            aria-hidden
          />
          <div
            className="fixed z-[8010] py-1 rounded-lg bg-surfaceRaised border border-border shadow-xl min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-surface rounded-t-lg"
              onClick={() => {
                onMarkOnChart(contextMenu.index);
                setContextMenu(null);
              }}
            >
              {t('contextMenu.markOnChart')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
