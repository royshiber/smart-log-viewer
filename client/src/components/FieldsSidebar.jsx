import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function FieldsSidebar({ fields, selected, onChange }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

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
      const match = items.filter((i) => i.full.toLowerCase().includes(q));
      if (match.length) out[msg] = match;
    }
    return out;
  }, [grouped, search]);

  const toggle = (full) => {
    onChange(selected.includes(full) ? selected.filter((s) => s !== full) : [...selected, full]);
  };

  return (
    <div className="h-full flex flex-col bg-surfaceRaised border-r border-border">
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder={t('fields.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded bg-surface border border-border text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
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
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface cursor-pointer text-sm text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(full)}
                    onChange={() => toggle(full)}
                    className="rounded border-border accent-accent"
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
