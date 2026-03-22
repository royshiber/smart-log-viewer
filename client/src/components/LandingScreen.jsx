import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VehicleGrid } from './VehicleGrid';
import { VehicleLogsScreen } from './VehicleLogsScreen';
import { addVehicle, getVehicles } from '../db/logsDb';

/**
 * Figma launcher: two dashed cards → opaque vehicle picker → vehicle logs screen.
 */
export function LandingScreen({
  vehicleGridRef,
  onFile,
  onFiles,
  loading,
  progress,
  error,
  selectedVehicleId,
  onSelectVehicle,
  onVehiclesChange,
  vehicles,
  onLoadLog,
  onPrompt,
}) {
  const { t, i18n } = useTranslation();
  const [screen, setScreen] = useState('landing'); // 'landing' | 'picker' | 'vehicleLogs'
  const isRtl = i18n.language === 'he';

  useEffect(() => {
    if (screen !== 'picker') return;
    const onKey = (e) => {
      if (e.key === 'Escape') setScreen('landing');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  /** Parent `vehicles` can be stale vs IndexedDB (e.g. after add). Resync before showing broken vehicleLogs. */
  useEffect(() => {
    if (screen !== 'vehicleLogs' || !selectedVehicleId) return;
    if (vehicles?.some((v) => v.id === selectedVehicleId)) return;
    let cancelled = false;
    getVehicles().then((list) => {
      if (cancelled) return;
      onVehiclesChange?.(list);
      if (!list.some((x) => x.id === selectedVehicleId)) {
        onSelectVehicle(null);
        setScreen('picker');
      }
    });
    return () => { cancelled = true; };
  }, [screen, selectedVehicleId, vehicles, onVehiclesChange, onSelectVehicle]);

  const handleVehicleSelect = (id) => {
    onSelectVehicle(id);
    setScreen('vehicleLogs');
  };

  const handleAddNew = async () => {
    const name = onPrompt
      ? await onPrompt(t('vehicle.newVehiclePrompt', 'שם הכטב"ם:'), '')
      : window.prompt(t('vehicle.newVehiclePrompt'), '');
    if (name == null) return;
    const v = await addVehicle(name);
    const list = await getVehicles();
    onVehiclesChange?.(list);
    onSelectVehicle(v.id);
    setScreen('vehicleLogs');
  };

  if (screen === 'vehicleLogs' && selectedVehicleId) {
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    return (
      <VehicleLogsScreen
        vehicle={vehicle}
        onFile={onFile}
        onFiles={onFiles}
        loading={loading}
        progress={progress}
        error={error}
        onLoadLog={onLoadLog}
        onBack={() => setScreen('picker')}
      />
    );
  }

  if (screen === 'picker') {
    return (
      <div className="flex-1 flex flex-col bg-figmaBg min-h-0">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-semibold text-white">{t('landing.pickerTitle')}</h2>
          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="text-white/80 hover:text-white text-[56px] leading-none px-3"
            aria-label={t('landing.closePicker')}
          >
            {isRtl ? '→' : '←'}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-y-auto p-6">
          <VehicleGrid
            ref={vehicleGridRef}
            selectedId={selectedVehicleId}
            onSelect={handleVehicleSelect}
            onVehiclesChange={onVehiclesChange}
            onPrompt={onPrompt}
            hideAddButton
            adaptive
            noAutoSelect
            className="!max-w-none w-full justify-center flex-wrap"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto bg-[#05070f]">
      {/* Dramatic neon scene */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.26),transparent_42%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.22),transparent_36%),radial-gradient(circle_at_50%_88%,rgba(16,185,129,0.18),transparent_38%)]" />
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-cyan-300/20 blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-10 md:py-14">
        <div className="w-full max-w-6xl overflow-hidden rounded-[2.2rem] border border-white/15 bg-[#070b19]/90 shadow-[0_30px_120px_-36px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
          <div className="relative p-8 md:p-12">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative text-center">
              <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white md:text-7xl">
                {t('appTitle')}
              </h1>
            </div>

            <div className="relative mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setScreen('picker')}
                className="group relative overflow-hidden rounded-3xl border border-cyan-300/35 bg-gradient-to-br from-cyan-400/20 via-cyan-400/5 to-transparent px-8 py-10 text-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-cyan-200 hover:shadow-[0_22px_50px_-26px_rgba(34,211,238,0.95)]"
                aria-label={t('landing.selectExisting')}
              >
                <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl transition-transform duration-300 group-hover:scale-110" />
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
                <div className="relative">
                  <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_16px_rgba(103,232,249,0.35)]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-5-5H6a2 2 0 0 0-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">{t('landing.selectExisting')}</h2>
                </div>
              </button>

              <button
                type="button"
                onClick={handleAddNew}
                className="group relative overflow-hidden rounded-3xl border border-emerald-300/35 bg-gradient-to-br from-emerald-400/22 via-emerald-400/7 to-transparent px-8 py-10 text-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-emerald-200 hover:shadow-[0_22px_50px_-26px_rgba(16,185,129,0.95)]"
                aria-label={t('landing.addNew')}
              >
                <div className="pointer-events-none absolute -left-10 -bottom-12 h-36 w-36 rounded-full bg-emerald-300/30 blur-2xl transition-transform duration-300 group-hover:scale-110" />
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
                <div className="relative">
                  <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/45 bg-emerald-300/18 text-4xl leading-none text-emerald-100 shadow-[0_0_16px_rgba(110,231,183,0.35)]">
                    +
                  </div>
                  <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">{t('landing.addNew')}</h2>
                </div>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 w-full max-w-5xl rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-center text-sm text-red-100 shadow-[0_10px_28px_-18px_rgba(248,81,73,0.95)]" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
