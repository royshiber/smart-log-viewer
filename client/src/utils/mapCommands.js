/**
 * Execute map commands from Gemini on a Leaflet map instance.
 * @param {L.Map} map - Leaflet map instance
 * @param {Array} commands - Array of { action, ...params }
 * @param {Function} setMarkers - (markers) => void for addMarker/clearMarkers
 * @param {Function} setPathColorConfig - (config|null) => void for colorPathByField/resetPathColor
 */
export function executeMapCommands(map, commands, setMarkers, setPathColorConfig) {
  if (!commands?.length) return;
  for (const cmd of commands) {
    try {
      if (cmd.action === 'setCenter' && cmd.lat != null && cmd.lng != null) {
        map?.setView([cmd.lat, cmd.lng], map.getZoom());
      } else if (cmd.action === 'setZoom' && cmd.zoom != null) {
        map?.setZoom(cmd.zoom);
      } else if (cmd.action === 'fitBounds' && Array.isArray(cmd.bounds) && cmd.bounds.length >= 2) {
        map?.fitBounds(cmd.bounds, { padding: [30, 30] });
      } else if (cmd.action === 'addMarker' && cmd.lat != null && cmd.lng != null && setMarkers) {
        setMarkers((prev) => [...prev, { lat: cmd.lat, lng: cmd.lng, label: cmd.label || '' }]);
      } else if (cmd.action === 'clearMarkers' && setMarkers) {
        setMarkers([]);
      } else if (cmd.action === 'setPathColor' && cmd.color && setPathColorConfig) {
        setPathColorConfig({ solidColor: cmd.color });
      } else if (cmd.action === 'colorPathByThreshold' && cmd.field && cmd.threshold != null && setPathColorConfig) {
        setPathColorConfig({
          field: cmd.field,
          threshold: Number(cmd.threshold),
          aboveColor: cmd.aboveColor || '#3fb950',
          belowColor: cmd.belowColor || '#58a6ff',
        });
      } else if (cmd.action === 'colorPathByField' && cmd.field && setPathColorConfig) {
        setPathColorConfig({
          field: cmd.field,
          positiveColor: cmd.positiveColor || '#f85149',
          negativeColor: cmd.negativeColor || '#d29922',
          zeroColor: cmd.zeroColor || '#58a6ff',
        });
      } else if (cmd.action === 'resetPathColor' && setPathColorConfig) {
        setPathColorConfig(null);
      }
    } catch (e) {
      console.warn('Map command failed:', cmd, e);
    }
  }
}
