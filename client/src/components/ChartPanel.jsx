import { useMemo, useState, useRef } from 'react';
import Plot from 'react-plotly.js';
import { useTranslation } from 'react-i18next';
import { getFieldLabel } from '../utils/fieldLabels';

// Fallback palette (App assigns `s.color`, but keep this in sync).
const COLORS = [
  '#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7', '#79c0ff', '#ff7b72', '#56d364',
  '#e6b800', '#6f42c1', '#22863a', '#dbab09', '#da6700', '#b3b3b3', '#1f6feb', '#ff00ff'
];

export function ChartPanel({ series, onTimeSelect, selectedTime }) {
  const { t, i18n } = useTranslation();
  const [contextMenu, setContextMenu] = useState(null);
  const lastHoverRef = useRef(null);

  const traces = useMemo(() => {
    if (!series || series.length === 0) return [];
    const n = series.length;
    const useMultiAxis = n > 1;
    return series.map((s, i) => {
      const yaxisName = useMultiAxis ? (i === 0 ? 'y' : `y${i + 1}`) : 'y';
      return {
        x: s.x,
        y: s.y,
        type: 'scatter',
        mode: 'lines',
        name: getFieldLabel(s.name, i18n.language),
        line: { color: s.color || COLORS[i % COLORS.length], width: 2 },
        ...(useMultiAxis && { yaxis: yaxisName })
      };
    });
  }, [series]);

  const layout = useMemo(() => {
    const n = series?.length || 0;
    const useMultiAxis = n > 1;
    const baseY = {
      gridcolor: '#30363d',
      linecolor: '#30363d',
      tickfont: { color: '#8b949e' },
      titlefont: { color: '#8b949e' }
    };
    const yaxes = { yaxis: { ...baseY } };
    if (useMultiAxis) {
      for (let i = 1; i < n; i++) {
        yaxes[`yaxis${i + 1}`] = {
          ...baseY,
          anchor: 'x',
          overlaying: 'y',
          side: 'right',
          automargin: true
        };
      }
    }
    return {
      margin: { t: 40, r: useMultiAxis ? 80 : 60, b: 60, l: 60 },
      xaxis: {
        title: t('chart.time'),
        gridcolor: '#30363d',
        linecolor: '#30363d',
        tickfont: { color: '#8b949e' },
        titlefont: { color: '#8b949e' }
      },
      ...yaxes,
      showlegend: true,
      legend: { x: 1, y: 1, xanchor: 'right', font: { color: '#8b949e' } },
      paper_bgcolor: '#0d1117',
      plot_bgcolor: '#161b22',
      font: { color: '#8b949e', size: 12 },
      shapes: selectedTime != null ? [{
        type: 'line',
        x0: selectedTime,
        x1: selectedTime,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: '#58a6ff', width: 2, dash: 'dot' }
      }] : []
    };
  }, [t, selectedTime, series?.length]);

  const config = { responsive: true, toImageButtonOptions: { format: 'png', filename: 'log-chart' } };

  if (!series || series.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surfaceRaised rounded-lg border border-border">
        <p className="text-gray-500">{t('chart.empty')}</p>
      </div>
    );
  }

  const handleHover = (eventData) => {
    if (eventData?.points?.[0]?.x != null) lastHoverRef.current = eventData.points[0].x;
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!onTimeSelect || lastHoverRef.current == null) return;
    setContextMenu({ x: e.clientX, y: e.clientY, timeValue: lastHoverRef.current });
  };

  const handleShowOnMap = () => {
    if (contextMenu?.timeValue != null) onTimeSelect(contextMenu.timeValue);
    setContextMenu(null);
  };

  return (
    <div
      className="flex-1 min-h-0 bg-surfaceRaised rounded-lg border border-border overflow-hidden relative"
      onContextMenu={handleContextMenu}
    >
      <Plot
        data={traces}
        layout={layout}
        config={config}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
        onHover={handleHover}
      />
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            aria-hidden
          />
          <div
            className="fixed z-50 py-1 rounded-lg bg-surfaceRaised border border-border shadow-xl min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-surface rounded-t-lg"
              onClick={handleShowOnMap}
            >
              {t('contextMenu.showOnMap')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
