import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useTranslation } from 'react-i18next';
import { getFieldLabel } from '../utils/fieldLabels';

const COLORS = ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#a371f7', '#79c0ff', '#ff7b72', '#56d364'];

export function ChartPanel({ series }) {
  const { t, i18n } = useTranslation();

  const traces = useMemo(() => {
    if (!series || series.length === 0) return [];
    return series.map((s, i) => ({
      x: s.x,
      y: s.y,
      type: 'scatter',
      mode: 'lines',
      name: getFieldLabel(s.name, i18n.language),
      line: { color: s.color || COLORS[i % COLORS.length], width: 2 }
    }));
  }, [series]);

  const layout = useMemo(() => ({
    margin: { t: 40, r: 40, b: 60, l: 60 },
    xaxis: {
      title: t('chart.time'),
      gridcolor: '#30363d',
      linecolor: '#30363d',
      tickfont: { color: '#8b949e' },
      titlefont: { color: '#8b949e' }
    },
    yaxis: {
      gridcolor: '#30363d',
      linecolor: '#30363d',
      tickfont: { color: '#8b949e' },
      titlefont: { color: '#8b949e' }
    },
    showlegend: true,
    legend: { x: 1, y: 1, xanchor: 'right', font: { color: '#8b949e' } },
    paper_bgcolor: '#0d1117',
    plot_bgcolor: '#161b22',
    font: { color: '#8b949e', size: 12 }
  }), [t]);

  const config = { responsive: true, toImageButtonOptions: { format: 'png', filename: 'log-chart' } };

  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-full flex-1 bg-surfaceRaised rounded-lg border border-border">
        <p className="text-gray-500">{t('chart.empty')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-surfaceRaised rounded-lg border border-border overflow-hidden">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        className="w-full h-full"
        style={{ width: '100%', minHeight: 300 }}
        useResizeHandler
      />
    </div>
  );
}
