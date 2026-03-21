import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getChartPresets, saveChartPreset, getMapPresets, saveMapPreset } from '../db/logsDb';

export function ChartPresetManager({ selectedFields, fieldColors, onApply }) {
  const { t } = useTranslation();
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getChartPresets().then(setPresets);
  }, []);

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
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="px-2 py-1 rounded text-xs border border-border text-gray-400 hover:text-gray-200"
        >
          {t('preset.myPresets')} ▾
        </button>
        {dropdownOpen && (
          <>
            <span className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} aria-hidden />
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] py-1 rounded bg-surfaceRaised border border-border shadow-xl">
              {presets.length === 0 ? (
                <p className="px-3 py-2 text-gray-500 text-sm">{t('logs.empty')}</p>
              ) : (
                presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApply(p)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface ${selectedPresetId === p.id ? 'text-accent' : 'text-gray-300'}`}
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
          </>
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
        className="px-2 py-1 rounded text-xs border border-border text-gray-400 hover:text-gray-200"
      >
        {t('preset.save')}
      </button>
      <button
        type="button"
        onClick={handleSaveAs}
        className="px-2 py-1 rounded text-xs border border-border text-gray-400 hover:text-gray-200"
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

  useEffect(() => {
    getMapPresets().then(setPresets);
  }, []);

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
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="px-2 py-1 rounded text-xs border border-border text-gray-400 hover:text-gray-200"
        >
          {t('preset.myPresets')} ▾
        </button>
        {dropdownOpen && (
          <>
            <span className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} aria-hidden />
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] py-1 rounded bg-surfaceRaised border border-border shadow-xl">
              {presets.length === 0 ? (
                <p className="px-3 py-2 text-gray-500 text-sm">{t('logs.empty')}</p>
              ) : (
                presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApply(p)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface ${selectedPresetId === p.id ? 'text-accent' : 'text-gray-300'}`}
                  >
                    {p.name}
                  </button>
                ))
              )}
            </div>
          </>
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
        className="px-2 py-1 rounded text-xs border border-border text-gray-400 hover:text-gray-200"
      >
        {t('preset.save')}
      </button>
      <button
        type="button"
        onClick={handleSaveAs}
        className="px-2 py-1 rounded text-xs border border-border text-gray-400 hover:text-gray-200"
      >
        {t('preset.saveAs')}
      </button>
    </div>
  );
}
