import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { VehicleGrid } from './VehicleGrid';
import { VehicleLogsScreen } from './VehicleLogsScreen';
import { addVehicle } from '../db/logsDb';

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
    onVehiclesChange?.([...vehicles, v]);
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
      <div className="flex-1 flex flex-col bg-surface min-h-0 aero-grid aero-grain">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surfaceContainerLow">
          <h2 className="font-bold font-headline text-accent uppercase text-xs tracking-[0.15em]">
            {t('landing.pickerTitle')}
          </h2>
          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="text-muted hover:text-accent text-3xl font-label font-bold leading-none px-3 py-1 border border-transparent hover:border-border transition-colors"
            aria-label={t('landing.closePicker')}
          >
            {isRtl ? '→' : '←'}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-y-auto p-6">
          <div className="w-full max-w-5xl">
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
            {vehicles.length === 0 && (
              <div className="mt-4 flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-muted">{t('vehicle.noVehiclesYet', 'אין עדיין כטב"מים. הוסף כטב"ם חדש כדי להתחיל.')}</p>
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="px-6 py-3 bg-accent text-white font-label font-bold text-[11px] tracking-[0.08em] uppercase border border-accent hover:opacity-90 transition-opacity"
                >
                  {t('landing.addNew')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-y-auto bg-surface aero-grid aero-grain">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-10 md:py-14">
        <div className="w-full border border-border bg-surfaceContainer shadow-[0_24px_80px_-40px_rgba(0,71,141,0.35)]">
          <div className="relative px-6 py-10 md:px-10 md:py-12">
            <div className="text-center space-y-2">
              <p className="font-label font-bold text-[10px] tracking-[0.2em] text-muted uppercase">
                STRATOS_V1
              </p>
              <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-accent">
                {t('appTitle')}
              </h1>
              <p className="text-sm text-muted max-w-xl mx-auto pt-2">
                {t('landing.subtitle', 'בחר כטב״ם קיים או צור פרופיל חדש להמשך ניתוח לוגים.')}
              </p>
            </div>

            <div className="relative mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setScreen('picker')}
                className="group relative flex items-center justify-between bg-surfaceContainer border border-border p-6 overflow-hidden text-start min-h-[120px] hover:border-accent/40 transition-colors"
                aria-label={t('landing.selectExisting')}
              >
                <div className="relative z-10 flex flex-col items-start gap-1">
                  <span className="font-label font-bold text-[11px] tracking-[0.12em] text-accent uppercase">
                    {t('landing.existingTag', 'ארכיון')}
                  </span>
                  <span className="font-headline font-bold text-2xl md:text-3xl text-onSurface tracking-tighter">
                    {t('landing.selectExisting')}
                  </span>
                </div>
                <div className="relative z-10 w-14 h-14 shrink-0 flex items-center justify-center bg-accent text-white">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-5-5H6a2 2 0 0 0-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 13h6M9 17h6" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-[0.06] transition-opacity pointer-events-none" />
              </button>

              <button
                type="button"
                onClick={handleAddNew}
                className="group relative flex items-center justify-between bg-surfaceContainer border border-border p-6 overflow-hidden text-start min-h-[120px] hover:border-accentSecondary/50 transition-colors"
                aria-label={t('landing.addNew')}
              >
                <div className="relative z-10 flex flex-col items-start gap-1">
                  <span className="font-label font-bold text-[11px] tracking-[0.12em] text-accentSecondary uppercase">
                    {t('landing.newTag', 'חדש')}
                  </span>
                  <span className="font-headline font-bold text-2xl md:text-3xl text-onSurface tracking-tighter">
                    {t('landing.addNew')}
                  </span>
                </div>
                <div className="relative z-10 w-14 h-14 shrink-0 flex items-center justify-center bg-accentSecondary text-white text-3xl font-light leading-none">
                  +
                </div>
                <div className="absolute inset-0 bg-accentSecondary opacity-0 group-hover:opacity-[0.06] transition-opacity pointer-events-none" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 w-full max-w-5xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-900" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
