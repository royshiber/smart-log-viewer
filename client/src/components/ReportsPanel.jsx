import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getFieldLabel, getShortHeHint } from '../utils/fieldLabels';
import { buildTimeToWallClock } from '../utils/csvGpsTime';
import { parseGraphRequestViaGemini } from '../api/chat';
import { parseGraphRequest } from '../utils/parseGraphRequest';
import { getReportCsvPresets, saveReportCsvPreset, getReportPdfPresets, saveReportPdfPreset } from '../db/logsDb';

function percentile(sortedVals, p) {
  if (!sortedVals.length) return null;
  const idx = (sortedVals.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedVals[lo];
  const w = idx - lo;
  return sortedVals[lo] * (1 - w) + sortedVals[hi] * w;
}

function computeStats(fields, getTimeSeries) {
  return fields.map((f) => {
    const ts = getTimeSeries(f);
    if (!ts?.y?.length) return null;
    const vals = ts.y.filter((v) => v != null && Number.isFinite(v));
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((acc, v) => acc + ((v - avg) ** 2), 0) / vals.length;
    const std = Math.sqrt(variance);
    const p95 = percentile(sorted, 0.95);
    const first = vals[0];
    const last = vals[vals.length - 1];
    const trend = last - first;
    const cv = avg !== 0 ? (std / Math.abs(avg)) * 100 : null;
    return {
      field: f,
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      std: std.toFixed(2),
      p95: (p95 ?? avg).toFixed(2),
      count: vals.length,
      first: first.toFixed(2),
      last: last.toFixed(2),
      trend: trend.toFixed(2),
      range: (max - min).toFixed(2),
      cv: cv == null ? '' : cv.toFixed(1),
    };
  }).filter(Boolean);
}

function resolveFieldName(name, available) {
  if (available.includes(name)) return name;
  const found = available.find((f) => f.endsWith(`.${name}`) || f === name);
  return found || name;
}

function filterFieldsBySearch(fields, q, lang) {
  if (!q?.trim()) return fields;
  const n = q.trim().toLowerCase();
  return fields.filter((f) => {
    if (f.toLowerCase().includes(n)) return true;
    const label = getFieldLabel(f, lang).toLowerCase();
    if (label.includes(n)) return true;
    return getShortHeHint(f).toLowerCase().includes(n);
  });
}

export function ReportsPanel({ fields, selectedFields, getTimeSeries, logDisplayName, messages }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'he';
  const MIN_REPORT_PANEL_WIDTH = 260;
  const MAX_REPORT_PANEL_WIDTH = 720;
  const layoutRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(0);

  const [csvChecked, setCsvChecked] = useState([]);
  const [csvSearch, setCsvSearch] = useState('');
  const [csvNl, setCsvNl] = useState('');
  const [csvNlLoading, setCsvNlLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [csvPanelWidth, setCsvPanelWidth] = useState(() => {
    const raw = Number(localStorage.getItem('reportsCsvWidthPx'));
    const base = Number.isFinite(raw) ? raw : 420;
    return Math.min(MAX_REPORT_PANEL_WIDTH, Math.max(MIN_REPORT_PANEL_WIDTH, base));
  });
  const [pdfPanelWidth, setPdfPanelWidth] = useState(() => {
    const raw = Number(localStorage.getItem('reportsPdfWidthPx'));
    const base = Number.isFinite(raw) ? raw : 420;
    return Math.min(MAX_REPORT_PANEL_WIDTH, Math.max(MIN_REPORT_PANEL_WIDTH, base));
  });
  const [csvPresets, setCsvPresets] = useState([]);
  const [pdfPresets, setPdfPresets] = useState([]);

  const wallClock = useMemo(() => (messages ? buildTimeToWallClock(messages) : null), [messages]);

  useEffect(() => {
    setReportTitle(logDisplayName || '');
  }, [logDisplayName]);

  useEffect(() => {
    setCsvChecked(selectedFields.slice());
  }, [selectedFields]);

  useEffect(() => {
    localStorage.setItem('reportsCsvWidthPx', String(csvPanelWidth));
  }, [csvPanelWidth]);

  useEffect(() => {
    localStorage.setItem('reportsPdfWidthPx', String(pdfPanelWidth));
  }, [pdfPanelWidth]);

  useEffect(() => {
    const el = layoutRef.current;
    if (!el) return undefined;
    const update = () => {
      setAvailableWidth(Math.max(0, Math.floor(el.clientWidth)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    getReportCsvPresets().then(setCsvPresets).catch(() => {});
    getReportPdfPresets().then(setPdfPresets).catch(() => {});
  }, []);

  useEffect(() => {
    if (!availableWidth) return;
    const maxSum = Math.max(MIN_REPORT_PANEL_WIDTH * 2, availableWidth);
    const sum = csvPanelWidth + pdfPanelWidth;
    if (sum <= maxSum) return;
    const overflow = sum - maxSum;
    const shrinkPdf = Math.min(overflow, Math.max(0, pdfPanelWidth - MIN_REPORT_PANEL_WIDTH));
    const rem = overflow - shrinkPdf;
    const shrinkCsv = Math.min(rem, Math.max(0, csvPanelWidth - MIN_REPORT_PANEL_WIDTH));
    if (shrinkPdf > 0) setPdfPanelWidth((v) => v - shrinkPdf);
    if (shrinkCsv > 0) setCsvPanelWidth((v) => v - shrinkCsv);
  }, [availableWidth, csvPanelWidth, pdfPanelWidth]);

  const handleCsvWidthChange = useCallback((nextRaw) => {
    const next = Math.min(MAX_REPORT_PANEL_WIDTH, Math.max(MIN_REPORT_PANEL_WIDTH, Number(nextRaw)));
    if (!availableWidth) {
      setCsvPanelWidth(next);
      return;
    }
    const maxSum = Math.max(MIN_REPORT_PANEL_WIDTH * 2, availableWidth);
    const allowedCsv = Math.min(next, maxSum - MIN_REPORT_PANEL_WIDTH);
    const finalCsv = Math.max(MIN_REPORT_PANEL_WIDTH, allowedCsv);
    const targetPdf = Math.max(MIN_REPORT_PANEL_WIDTH, maxSum - finalCsv);
    setCsvPanelWidth(finalCsv);
    if (pdfPanelWidth > targetPdf) setPdfPanelWidth(targetPdf);
  }, [availableWidth, pdfPanelWidth]);

  const handlePdfWidthChange = useCallback((nextRaw) => {
    const next = Math.min(MAX_REPORT_PANEL_WIDTH, Math.max(MIN_REPORT_PANEL_WIDTH, Number(nextRaw)));
    if (!availableWidth) {
      setPdfPanelWidth(next);
      return;
    }
    const maxSum = Math.max(MIN_REPORT_PANEL_WIDTH * 2, availableWidth);
    const allowedPdf = Math.min(next, maxSum - MIN_REPORT_PANEL_WIDTH);
    const finalPdf = Math.max(MIN_REPORT_PANEL_WIDTH, allowedPdf);
    const targetCsv = Math.max(MIN_REPORT_PANEL_WIDTH, maxSum - finalPdf);
    setPdfPanelWidth(finalPdf);
    if (csvPanelWidth > targetCsv) setCsvPanelWidth(targetCsv);
  }, [availableWidth, csvPanelWidth]);

  const filteredFields = useMemo(
    () => filterFieldsBySearch(fields, csvSearch, i18n.language),
    [fields, csvSearch, i18n.language]
  );
  const reportFields = useMemo(
    () => (selectedFields.length ? selectedFields : csvChecked),
    [selectedFields, csvChecked]
  );

  const toggleCsv = (f) => {
    setCsvChecked((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const applyCsvNaturalLanguage = useCallback(async () => {
    const text = csvNl.trim();
    if (!text || !fields.length) return;
    setCsvNlLoading(true);
    try {
      let names = [];
      try {
        const { fields: parsed } = await parseGraphRequestViaGemini(text, fields);
        names = (parsed || [])
          .map((p) => resolveFieldName(p.name, fields))
          .filter((n) => fields.includes(n));
      } catch {
        const local = parseGraphRequest(text, fields);
        names = (local.fields || []).map((p) => p.name).filter((n) => fields.includes(n));
      }
      const localExtra = parseGraphRequest(text, fields);
      for (const p of localExtra.fields || []) {
        if (fields.includes(p.name) && !names.includes(p.name)) names.push(p.name);
      }
      setCsvChecked((prev) => [...new Set([...prev, ...names])]);
    } finally {
      setCsvNlLoading(false);
    }
  }, [csvNl, fields]);

  const handleExportCsv = () => {
    const cols = csvChecked.length ? csvChecked : selectedFields;
    if (!cols.length) return;
    const seriesData = cols.map((f) => ({ f, ts: getTimeSeries(f) })).filter((s) => s.ts?.x?.length);
    if (!seriesData.length) return;

    const timeSet = new Set();
    seriesData.forEach((s) => s.ts.x.forEach((x) => timeSet.add(x)));
    const times = Array.from(timeSet).sort((a, b) => a - b);

    const timeCol = 'log_time_us';
    const extra = wallClock ? ['utc_iso_+00:00', 'israel_local_time'] : [];
    const header = [timeCol, ...extra, ...seriesData.map((s) => s.f)].join(',');

    const rows = times.map((tVal) => {
      const parts = [tVal];
      if (wallClock) {
        const w = wallClock(tVal);
        parts.push(w ? `"${w.utcIso}"` : '', w ? `"${w.israelLocal}"` : '');
      }
      for (const s of seriesData) {
        const idx = s.ts.x.indexOf(tVal);
        parts.push(idx >= 0 ? (s.ts.y[idx] ?? '') : '');
      }
      return parts.join(',');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(logDisplayName || 'flight').replace(/[/\\?%*:|"<>]/g, '-')}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdf = async () => {
    if (!reportFields.length) return;
    setReportLoading(true);
    try {
      const stats = computeStats(reportFields, getTimeSeries);

      let formattedRows = [];
      let englishTitle = 'Flight report';
      let executiveSummaryEn = '';
      let engineeringConclusionEn = '';
      let keyFindingsEn = [];

      try {
        const res = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: reportTitle, observations, stats, outputLanguage: 'en' }),
        });
        const data = await res.json();
        formattedRows = data.rows || [];
        if (data.englishTitle && typeof data.englishTitle === 'string') englishTitle = data.englishTitle;
        if (typeof data.executiveSummaryEn === 'string') executiveSummaryEn = data.executiveSummaryEn;
        if (typeof data.engineeringConclusionEn === 'string') engineeringConclusionEn = data.engineeringConclusionEn;
        if (Array.isArray(data.keyFindingsEn)) keyFindingsEn = data.keyFindingsEn.filter(Boolean).slice(0, 6);
      } catch {
        formattedRows = stats.map((s) => ({
          field: s.field,
          min: s.min,
          max: s.max,
          avg: s.avg,
          std: s.std,
          p95: s.p95,
          trend: s.trend,
          riskLevel: 'MEDIUM',
          note: '',
          recommendation: '',
        }));
      }

      if (!formattedRows.length) {
        formattedRows = stats.map((s) => ({
          field: s.field,
          min: s.min,
          max: s.max,
          avg: s.avg,
          std: s.std,
          p95: s.p95,
          trend: s.trend,
          riskLevel: 'MEDIUM',
          note: '',
          recommendation: '',
        }));
      }

      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(englishTitle, pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(
        `Generated ${new Date().toLocaleString('en-GB')}  |  Fields analyzed: ${formattedRows.length}`,
        pageWidth / 2,
        26,
        { align: 'center' }
      );
      doc.setTextColor(0);

      let cursorY = 34;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive summary', 14, cursorY);
      cursorY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const execText = (executiveSummaryEn || '').trim() || 'No executive summary was generated.';
      doc.text(doc.splitTextToSize(execText, pageWidth - 28), 14, cursorY);
      cursorY += 10;

      if (keyFindingsEn.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Key findings', 14, cursorY);
        cursorY += 5;
        doc.setFont('helvetica', 'normal');
        keyFindingsEn.forEach((k) => {
          doc.text(`- ${k}`, 16, cursorY);
          cursorY += 4.2;
        });
        cursorY += 2;
      }

      autoTable(doc, {
        startY: cursorY,
        head: [['Field', 'Min', 'Max', 'Avg', 'Std', 'P95', 'Trend', 'Risk', 'Engineering insight']],
        body: formattedRows.map((r) => [
          r.field,
          r.min,
          r.max,
          r.avg,
          r.std || '',
          r.p95 || '',
          r.trend || '',
          (r.riskLevel || 'MEDIUM').toUpperCase(),
          r.note || '',
        ]),
        theme: 'grid',
        headStyles: { fillColor: [24, 93, 156], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8.5, cellPadding: 2.2, font: 'helvetica', valign: 'middle' },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' },
          8: { cellWidth: 'auto' },
        },
      });

      const recommendations = formattedRows
        .filter((r) => (r.recommendation || '').trim())
        .slice(0, 10)
        .map((r) => `${r.field}: ${r.recommendation}`);

      if (recommendations.length || engineeringConclusionEn.trim()) {
        let finalY = doc.lastAutoTable.finalY + 8;
        if (finalY > 188) {
          doc.addPage();
          finalY = 18;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Engineering conclusion', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const cText = engineeringConclusionEn.trim() || 'No additional engineering conclusion generated.';
        const cLines = doc.splitTextToSize(cText, pageWidth - 28);
        doc.text(cLines, 14, finalY + 6);
        let recY = finalY + 6 + (cLines.length * 4.2) + 4;
        if (recommendations.length) {
          doc.setFont('helvetica', 'bold');
          doc.text('Recommended follow-up actions', 14, recY);
          doc.setFont('helvetica', 'normal');
          recY += 5;
          recommendations.forEach((r) => {
            const lines = doc.splitTextToSize(`- ${r}`, pageWidth - 28);
            doc.text(lines, 16, recY);
            recY += (lines.length * 4.2);
          });
        }
      }

      const safeName = englishTitle.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80) || 'flight_report';
      doc.save(`${safeName}.pdf`);
    } finally {
      setReportLoading(false);
    }
  };

  if (!fields.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        {t('reports.noFields')}
      </div>
    );
  }

  return (
    <div ref={layoutRef} className="flex-1 min-h-0 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex min-h-0 h-full w-full">
      <div className="flex-none flex flex-col border-e border-border p-4 min-h-0" style={{ width: csvPanelWidth, minWidth: MIN_REPORT_PANEL_WIDTH, maxWidth: MAX_REPORT_PANEL_WIDTH }}>
        <h2 className="text-sm font-semibold text-accent mb-1">{t('reports.csvTitle')}</h2>
        <p className="text-xs text-gray-500 mb-2">{t('reports.csvDesc')}</p>
        <div className="mb-2">
          <input
            type="range"
            min={MIN_REPORT_PANEL_WIDTH}
            max={MAX_REPORT_PANEL_WIDTH}
            step={4}
            value={csvPanelWidth}
            onChange={(e) => handleCsvWidthChange(e.target.value)}
            className="w-full h-2 accent-accent cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            className="px-2 py-1 rounded text-xs border border-accent/50 text-accent hover:bg-accent/10"
            onClick={async () => {
              const name = window.prompt(isRtl ? 'שם פריסט CSV:' : 'CSV preset name:', '');
              if (!name || !name.trim()) return;
              const saved = await saveReportCsvPreset({ name: name.trim(), fields: csvChecked });
              setCsvPresets((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
            }}
          >
            {isRtl ? 'שמור פריסט CSV' : 'Save CSV preset'}
          </button>
          <select
            className="flex-1 min-w-0 px-2 py-1 rounded bg-surface border border-border text-xs text-gray-200"
            defaultValue=""
            onChange={(e) => {
              const p = csvPresets.find((x) => x.id === e.target.value);
              if (!p) return;
              setCsvChecked((p.fields || []).filter((f) => fields.includes(f)));
              e.target.value = '';
            }}
          >
            <option value="">{isRtl ? 'בחר פריסט CSV' : 'Apply CSV preset'}</option>
            {csvPresets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <p className="text-xs text-gray-600 mb-1">{t('reports.csvChatHint')}</p>
        <div className="flex gap-2 mb-3 shrink-0">
          <input
            type="text"
            value={csvNl}
            onChange={(e) => setCsvNl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyCsvNaturalLanguage(); }}
            disabled={csvNlLoading}
            placeholder={t('reports.csvChatPlaceholder')}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface border border-border text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <button
            type="button"
            onClick={applyCsvNaturalLanguage}
            disabled={csvNlLoading || !csvNl.trim()}
            className="shrink-0 px-3 py-2 rounded-lg bg-accent/20 text-accent text-sm font-medium border border-accent/40 hover:bg-accent/30 disabled:opacity-40"
          >
            {csvNlLoading ? '…' : t('reports.csvApply')}
          </button>
        </div>

        <input
          type="search"
          value={csvSearch}
          onChange={(e) => setCsvSearch(e.target.value)}
          placeholder={t('reports.fieldSearch')}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/50 mb-2 shrink-0"
        />

        {!wallClock && (
          <p className="text-xs text-amber-500/90 mb-2 shrink-0">{t('reports.noGpsTime')}</p>
        )}

        <div className="flex gap-2 mb-2 shrink-0">
          <button type="button" onClick={() => setCsvChecked(fields.slice())} className="text-xs text-accent hover:underline">
            {t('reports.selectAll')}
          </button>
          <span className="text-gray-600">·</span>
          <button type="button" onClick={() => setCsvChecked([])} className="text-xs text-gray-400 hover:text-gray-200">
            {t('reports.clearAll')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mb-4">
          {filteredFields.map((f) => (
            <label key={f} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-surface cursor-pointer">
              <input
                type="checkbox"
                checked={csvChecked.includes(f)}
                onChange={() => toggleCsv(f)}
                className="accent-accent mt-0.5 shrink-0"
              />
              <span className="flex-1 min-w-0 text-xs">
                <span className="text-gray-300 block truncate">{getFieldLabel(f, i18n.language)}</span>
                <span className="text-gray-500 block truncate">{f}</span>
                <span className="text-accent/70">{getShortHeHint(f)}</span>
              </span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!csvChecked.length && !selectedFields.length}
          className="w-full py-2 rounded-lg bg-accent text-surface text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {t('reports.exportBtn')}
        </button>
      </div>

      <div className="flex-none min-w-0 flex flex-col p-4 min-h-0 border-s border-border" style={{ width: pdfPanelWidth, minWidth: MIN_REPORT_PANEL_WIDTH, maxWidth: MAX_REPORT_PANEL_WIDTH }}>
        <h2 className="text-sm font-semibold text-accent mb-3">{t('reports.pdfTitle')}</h2>
        <div className="mb-2">
          <input
            type="range"
            min={MIN_REPORT_PANEL_WIDTH}
            max={MAX_REPORT_PANEL_WIDTH}
            step={4}
            value={pdfPanelWidth}
            onChange={(e) => handlePdfWidthChange(e.target.value)}
            className="w-full h-2 accent-accent cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            className="px-2 py-1 rounded text-xs border border-accent/50 text-accent hover:bg-accent/10"
            onClick={async () => {
              const name = window.prompt(isRtl ? 'שם פריסט PDF:' : 'PDF preset name:', '');
              if (!name || !name.trim()) return;
              const saved = await saveReportPdfPreset({
                name: name.trim(),
                titleTemplate: reportTitle,
                observationsTemplate: observations,
              });
              setPdfPresets((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
            }}
          >
            {isRtl ? 'שמור פריסט PDF' : 'Save PDF preset'}
          </button>
          <select
            className="flex-1 min-w-0 px-2 py-1 rounded bg-surface border border-border text-xs text-gray-200"
            defaultValue=""
            onChange={(e) => {
              const p = pdfPresets.find((x) => x.id === e.target.value);
              if (!p) return;
              setReportTitle(p.titleTemplate || reportTitle);
              setObservations(p.observationsTemplate || '');
              e.target.value = '';
            }}
          >
            <option value="">{isRtl ? 'בחר פריסט PDF' : 'Apply PDF preset'}</option>
            {pdfPresets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <label className="text-xs text-gray-400 mb-1">{t('reports.reportNameLabel')}</label>
        <input
          type="text"
          value={reportTitle}
          onChange={(e) => setReportTitle(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface border border-border text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/50 mb-3"
          placeholder={logDisplayName || (isRtl ? 'שם הטיסה' : 'Flight name')}
        />

        <label className="text-xs text-gray-400 mb-1">{t('reports.observationsLabel')}</label>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={6}
          className="flex-1 min-h-0 px-3 py-2 rounded-lg bg-surface border border-border text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none mb-4"
          placeholder={t('reports.observationsPlaceholder')}
        />

        <div className="text-xs text-gray-600 mb-3">
          {isRtl ? 'שדות בדוח:' : 'Fields in report:'}{' '}
          <span className="text-gray-400">{reportFields.length ? reportFields.join(', ') : (isRtl ? 'אין שדות נבחרים' : 'No fields selected')}</span>
        </div>

        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={reportLoading || !reportFields.length}
          className="w-full py-2 rounded-lg bg-figmaAccent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {reportLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {t('reports.generating')}
            </>
          ) : t('reports.generateBtn')}
        </button>
      </div>
      </div>
    </div>
  );
}
