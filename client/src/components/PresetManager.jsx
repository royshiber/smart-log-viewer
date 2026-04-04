import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getChartPresets, saveChartPreset, getMapPresets, saveMapPreset } from '../db/logsDb';

/**
 * Close preset dropdown on Escape or pointer-down outside the menu (no fullscreen backdrop).
 * Full-screen transparent overlays fight Plotly z-stacking and can block the whole app on
 * some browsers / touch devices when events do not reach the overlay.
 */
export function ChartPresetManager({ selectedFields, fieldColors, onApply }) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const presetMenuRef = useRef(null);

  useEffect(() => {
    getChartPresets().then(setPresets);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const down = (e) => {
      const el = presetMenuRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('touchstart', down, true);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('touchstart', down, true);
    };
  }, [dropdownOpen]);

  const handleApply = (p) => {
    onApply(p.selectedFields, p.fieldColors);
    setSelectedPresetId(p.id);
    setDropdownOpen(false);
  };

  const handleSave = () => {
    const name = selectedPresetId
      ? presets.find((x) => x.id === selectedPresetId)?.name
      : window.prompt(t('preset.namePrompt'), '');
    if (name == null) return;
    saveChartPreset({
      id: selectedPresetId,
      name,
      selectedFields,
      fieldColors,
    }).then((p) => {
      setPresets((prev) => {
        const rest = prev.filter((x) => x.id !== p.id);
        return [p, ...rest];
      });
      setSelectedPresetId(p.id);
    });
  };

  const handleSaveAs = () => {
    const name = window.prompt(t('preset.namePrompt'), '');
    if (name == null || !name.trim()) return;
    saveChartPreset({ name, selectedFields, fieldColors }).then((p) => {
      setPresets((prev) => [p, ...prev]);
      setSelectedPresetId(p.id);
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative" ref={presetMenuRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="px-2 py-1 rounded text-xs border border-border text-muted hover:text-onSurface"
        >
          {t('preset.myPresets')} ▾
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded border border-border bg-surfaceRaised py-1 shadow-xl">
            {presets.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">{t('logs.empty')}</p>
            ) : (
              presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApply(p)}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface ${selectedPresetId === p.id ? 'text-accent' : 'text-onSurface'}`}
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleSaveAs}
        className="px-2 py-1 rounded text-xs border border-accent/50 text-accent hover:bg-accent/10"
      >
        {t('preset.addPreset')}
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="px-2 py-1 rounded text-xs border border-border text-muted hover:text-onSurface"
      >
        {t('preset.save')}
      </button>
      <button
        type="button"
        onClick={handleSaveAs}
        className="px-2 py-1 rounded text-xs border border-border text-muted hover:text-onSurface"
      >
        {t('preset.saveAs')}
      </button>
    </div>
  );
}

export function MapPresetManager({ pathColorConfig, onApply }) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const presetMenuRef = useRef(null);

  useEffect(() => {
    getMapPresets().then(setPresets);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const down = (e) => {
      const el = presetMenuRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('touchstart', down, true);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('touchstart', down, true);
    };
  }, [dropdownOpen]);

  const handleApply = (p) => {
    onApply(p.pathColorConfig);
    setSelectedPresetId(p.id);
    setDropdownOpen(false);
  };

  const handleSave = () => {
    const name = selectedPresetId
      ? presets.find((x) => x.id === selectedPresetId)?.name
      : window.prompt(t('preset.namePrompt'), '');
    if (name == null) return;
    saveMapPreset({
      id: selectedPresetId,
      name,
      pathColorConfig,
    }).then((p) => {
      setPresets((prev) => {
        const rest = prev.filter((x) => x.id !== p.id);
        return [p, ...rest];
      });
      setSelectedPresetId(p.id);
    });
  };

  const handleSaveAs = () => {
    const name = window.prompt(t('preset.namePrompt'), '');
    if (name == null || !name.trim()) return;
    saveMapPreset({ name, pathColorConfig }).then((p) => {
      setPresets((prev) => [p, ...prev]);
      setSelectedPresetId(p.id);
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative" ref={presetMenuRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="px-2 py-1 rounded text-xs border border-border text-muted hover:text-onSurface"
        >
          {t('preset.myPresets')} ▾
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded border border-border bg-surfaceRaised py-1 shadow-xl">
            {presets.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">{t('logs.empty')}</p>
            ) : (
              presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApply(p)}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface ${selectedPresetId === p.id ? 'text-accent' : 'text-onSurface'}`}
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleSaveAs}
        className="px-2 py-1 rounded text-xs border border-accent/50 text-accent hover:bg-accent/10"
      >
        {t('preset.addPreset')}
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="px-2 py-1 rounded text-xs border border-border text-muted hover:text-onSurface"
      >
        {t('preset.save')}
      </button>
      <button
        type="button"
        onClick={handleSaveAs}
        className="px-2 py-1 rounded text-xs border border-border text-muted hover:text-onSurface"
      >
        {t('preset.saveAs')}
      </button>
    </div>
  );
}
