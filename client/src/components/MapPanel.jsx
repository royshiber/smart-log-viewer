import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

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

export function MapPanel({ path, onMapReady, markers = [], pathColorConfig, pathWithValues, selectedTimeIndex, onPathIndexSelect }) {
  const { t, i18n } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);

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
      <div className="h-full w-full flex items-center justify-center bg-surfaceContainer border border-border aero-grid">
        <p className="text-muted">{t('map.noGps')}</p>
      </div>
    );
  }

  const center = path[Math.floor(path.length / 2)] || [32, 35];

  return (
    <div className="flex-1 min-h-0 border border-border overflow-hidden">
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
              html: '<div style="width:16px;height:16px;border-radius:50%;background:#00478d;border:3px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
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
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[1000]"
            onClick={() => setContextMenu(null)}
            aria-hidden
          />
          <div
            className="fixed z-[1001] py-1 bg-surfaceContainer border border-border shadow-xl min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-onSurface hover:bg-surfaceRaised"
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
