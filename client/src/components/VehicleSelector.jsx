import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getVehicles, addVehicle } from '../db/logsDb';

export function VehicleSelector({ selectedId, onSelect, onVehiclesChange }) {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicles().then((v) => {
      setVehicles(v);
      setLoading(false);
      onVehiclesChange?.(v);
      if (v.length && !selectedId) onSelect(v[0].id);
    }).catch(() => setLoading(false));
  }, []);

  const handleNewVehicle = () => {
    const name = window.prompt(t('vehicle.newVehiclePrompt'), '');
    if (name == null) return;
    addVehicle(name).then((v) => {
      const next = [...vehicles, v];
      setVehicles(next);
      onVehiclesChange?.(next);
      onSelect(v.id);
    });
  };

  if (loading) return <span className="text-muted text-sm">{t('common.loading')}</span>;

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="px-3 py-1.5 bg-surfaceContainer border border-border text-onSurface text-sm focus:outline-none focus:ring-2 focus:ring-accent/35 min-w-[140px]"
      >
        <option value="">{t('vehicle.select')}</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleNewVehicle}
        className="px-2 py-1.5 rounded text-sm border border-accent/50 text-accent hover:bg-accent/10"
      >
        {t('vehicle.newVehicle')}
      </button>
    </div>
  );
}
