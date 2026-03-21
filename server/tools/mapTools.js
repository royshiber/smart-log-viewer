import { register } from './registry.js';

register('setCenter',
  'Pan map to specific coordinates',
  { lat: 'number', lng: 'number' }
);

register('setZoom',
  'Change zoom level (1=world, 18=street)',
  { zoom: 'number (1-18)' }
);

register('fitBounds',
  'Fit map viewport to show a geographic area',
  { bounds: '[[lat,lng],[lat,lng]]' }
);

register('addMarker',
  'Add a labeled pin at coordinates',
  { lat: 'number', lng: 'number', label: 'string' }
);

register('clearMarkers',
  'Remove all markers from the map',
  {}
);

register('setPathColor',
  'Color the entire flight path with a single solid color',
  { color: '#hex e.g. "#FFFF00" for yellow, "#FF0000" for red' }
);

register('colorPathByField',
  'Color each path segment by a flight data field value. positiveColor for value>0, negativeColor for value<0. field must be in availableFields.',
  { field: 'MessageType.FieldName', positiveColor: '#hex', negativeColor: '#hex' }
);

register('colorPathByThreshold',
  'Color path segments above/below a specific numeric threshold. Use when user says "above X", "below Y", "higher than", "lower than", etc. field must be in availableFields.',
  { field: 'MessageType.FieldName', threshold: 'number', aboveColor: '#hex', belowColor: '#hex' }
);

register('resetPathColor',
  'Reset flight path to default blue color',
  {}
);
