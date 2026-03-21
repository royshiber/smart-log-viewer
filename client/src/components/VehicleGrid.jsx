import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../db/logsDb';
import { VehicleCard } from './VehicleCard';

const MIN_CARD = 64;
const MAX_CARD = 200;
const GAP = 12;

/**
 * Horizontal row of vehicle cards + optional "Add" button.
 * When `adaptive` is true, cards scale to fill available space.
 */
export const VehicleGrid = forwardRef(function VehicleGrid(
  { selectedId, onSelect, onVehiclesChange, hideAddButton = false, adaptive = false, noAutoSelect = false, onPrompt, className = '' },
  ref
) {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardSize, setCardSize] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    getVehicles().then((v) => {
      setVehicles(v);
      setLoading(false);
      onVehiclesChange?.(v);
      if (!noAutoSelect && v.length && !selectedId) onSelect(v[0].id);
    }).catch(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!adaptive || !containerRef.current) return;
    const el = containerRef.current;
    const compute = () => {
      const count = vehicles.length || 1;
      const w = el.clientWidth;
      const raw = Math.floor((w - GAP * (count - 1)) / count);
      setCardSize(Math.max(MIN_CARD, Math.min(MAX_CARD, raw)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [adaptive, vehicles.length]);

  const sync = useCallback((next) => {
    setVehicles(next);
    onVehiclesChange?.(next);
  }, [onVehiclesChange]);

  const handleAdd = useCallback(async () => {
    const name = onPrompt
      ? await onPrompt(t('vehicle.newVehiclePrompt', 'שם הכטב"ם:'), '')
      : window.prompt(t('vehicle.newVehiclePrompt', 'שם הכטב"ם:'), '');
    if (name == null) return;
    const v = await addVehicle(name);
    setVehicles((prev) => {
      const next = [...prev, v];
      onVehiclesChange?.(next);
      return next;
    });
    onSelect(v.id);
  }, [t, onSelect, onVehiclesChange, onPrompt]);

  useImperativeHandle(ref, () => ({
    addVehicle: () => handleAdd(),
  }), [handleAdd]);

  const handleRename = async (id, name) => {
    const updated = await updateVehicle(id, { name });
    sync(vehicles.map((v) => (v.id === id ? updated : v)));
  };

  const handlePhoto = async (id, photo) => {
    const updated = await updateVehicle(id, { photo });
    sync(vehicles.map((v) => (v.id === id ? updated : v)));
  };

  const handleDelete = async (id) => {
    await deleteVehicle(id);
    const next = vehicles.filter((v) => v.id !== id);
    sync(next);
    if (selectedId === id) onSelect(next[0]?.id ?? null);
  };

  if (loading) return <span className="text-gray-500 text-xs px-2">{t('common.loading')}</span>;

  return (
    <div
      ref={containerRef}
      className={`flex items-center overflow-x-auto py-1 px-1 ${adaptive ? '' : 'max-w-[420px]'} ${className}`}
      style={{ gap: adaptive ? GAP : 8 }}
    >
      {vehicles.map((v) => (
        <VehicleCard
          key={v.id}
          vehicle={v}
          selected={v.id === selectedId}
          onClick={() => onSelect(v.id)}
          onRename={handleRename}
          onPhotoChange={handlePhoto}
          onDelete={handleDelete}
          onPrompt={onPrompt}
          size={adaptive ? cardSize : undefined}
        />
      ))}
      {!hideAddButton && (
        <button
          type="button"
          onClick={handleAdd}
          title={t('vehicle.newVehicle')}
          className="w-14 h-14 rounded-lg border border-dashed border-border text-gray-500 hover:border-accent/50 hover:text-accent flex items-center justify-center text-2xl shrink-0 transition-colors"
        >
          +
        </button>
      )}
    </div>
  );
});

VehicleGrid.displayName = 'VehicleGrid';
