import { useEffect, useMemo, useState } from 'react';
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
  pathName = 'flight-path',
  onResetPathColor,
  selectedTimeIndex,
  onPathIndexSelect
}) {
  const { t, i18n } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);
  const [viewMode, setViewMode] = useState('2d');

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

  return (
    <div className="relative flex-1 min-h-0 rounded-lg border border-border overflow-hidden">
      {viewMode === '2d' ? (
        <MapContainer
          center={center}
          zoom={14}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pathSegments?.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg.positions}
              pathOptions={{ color: seg.color, weight: 4 }}
              eventHandlers={onPathIndexSelect ? {
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
          <FitBounds path={path} />
          {selectedTimeIndex != null && <CenterOnIndex path={path} index={selectedTimeIndex} />}
          {onMapReady && <MapController onReady={onMapReady} />}
        </MapContainer>
      ) : (
        <div className="w-full h-full bg-surface">
          <Plot
            data={trace3D}
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
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[1000]"
            onClick={() => setContextMenu(null)}
            aria-hidden
          />
          <div
            className="fixed z-[1001] py-1 rounded-lg bg-surfaceRaised border border-border shadow-xl min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-surface rounded-t-lg"
              onClick={() => {
                onPathIndexSelect(contextMenu.index);
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
