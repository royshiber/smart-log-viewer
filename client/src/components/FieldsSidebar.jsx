import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFieldLabel } from '../utils/fieldLabels';

export function FieldsSidebar({ fields, selected, onChange, defaultCollapsed = true }) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const grouped = useMemo(() => {
    const out = {};
    for (const f of fields) {
      const dot = f.indexOf('.');
      const msg = dot > 0 ? f.slice(0, dot) : f;
      const field = dot > 0 ? f.slice(dot + 1) : '';
      if (!out[msg]) out[msg] = [];
      out[msg].push({ full: f, field });
    }
    return out;
  }, [fields]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const out = {};
    for (const [msg, items] of Object.entries(grouped)) {
      const match = items.filter((i) =>
        i.full.toLowerCase().includes(q) ||
        getFieldLabel(i.full, i18n.language).toLowerCase().includes(q)
      );
      if (match.length) out[msg] = match;
    }
    return out;
  }, [grouped, search, i18n.language]);

  const toggle = (full) => {
    onChange(selected.includes(full) ? selected.filter((s) => s !== full) : [...selected, full]);
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col bg-surfaceContainerLow border-r border-border w-10 shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="p-2 w-full flex items-center justify-center text-muted hover:text-accent hover:bg-surfaceRaised border-b border-border h-10"
          title={t('fields.select')}
          aria-label={t('fields.select')}
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surfaceRaised border-r border-border w-64 shrink-0">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <input
          type="text"
          placeholder={t('fields.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 bg-surfaceContainer border border-border text-onSurface placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/35 text-sm"
        />
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="ml-1 px-2 py-1 text-muted hover:text-onSurface"
          aria-label="Collapse"
        >
          −
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filtered).map(([msgName, items]) => (
          <div key={msgName} className="mb-3">
            <div className="text-xs font-medium text-accent/90 uppercase tracking-wider px-2 py-1">
              {msgName}
            </div>
            <div className="space-y-0.5">
              {items.map(({ full, field }) => (
                <label
                  key={full}
                  className="flex items-start gap-2 px-2 py-1 hover:bg-surfaceRaised cursor-pointer text-sm text-onSurface"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(full)}
                    onChange={() => toggle(full)}
                    className="border-border accent-accent"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-onSurface">{getFieldLabel(full, i18n.language)}</span>
                    <span className="block truncate text-xs text-muted">{full || field}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
