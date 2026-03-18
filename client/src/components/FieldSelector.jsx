import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function FieldSelector({ messageTypes, selected, onChange }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState({});

  const grouped = useMemo(() => {
    const out = {};
    for (const [msgName, info] of Object.entries(messageTypes)) {
      const exp = info.expressions || (info.complexFields && Object.keys(info.complexFields));
      if (!exp) continue;
      const list = Array.isArray(exp) ? exp : Object.keys(exp);
      const fields = list.filter((f) => f !== 'TimeUS' && f !== 'time_boot_ms');
      if (fields.length === 0) continue;
      out[msgName] = fields;
    }
    return out;
  }, [messageTypes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const out = {};
    for (const [msg, fields] of Object.entries(grouped)) {
      const match = fields.filter((f) =>
        `${msg}.${f}`.toLowerCase().includes(q) || msg.toLowerCase().includes(q)
      );
      if (match.length) out[msg] = match;
    }
    return out;
  }, [grouped, search]);

  const toggle = (msgName, fieldName) => {
    const key = `${msgName}.${fieldName}`;
    const next = selected.includes(key)
      ? selected.filter((s) => s !== key)
      : [...selected, key];
    onChange(next);
  };

  const toggleGroup = (msgName) => {
    setOpenGroups((prev) => ({ ...prev, [msgName]: !prev[msgName] }));
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <div className="p-2 border-b dark:border-gray-700">
        <input
          type="text"
          placeholder={t('fields.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {Object.entries(filtered).map(([msgName, fields]) => (
          <div key={msgName} className="mb-2">
            <button
              type="button"
              onClick={() => toggleGroup(msgName)}
              className="w-full text-left px-2 py-1 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex justify-between"
            >
              {msgName}
              <span>{openGroups[msgName] ? '−' : '+'}</span>
            </button>
            {openGroups[msgName] !== false && (
              <div className="pl-2 mt-1 space-y-0.5">
                {fields.map((fieldName) => {
                  const key = `${msgName}.${fieldName}`;
                  const checked = selected.includes(key);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(msgName, fieldName)}
                      />
                      <span className="text-sm">{fieldName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
