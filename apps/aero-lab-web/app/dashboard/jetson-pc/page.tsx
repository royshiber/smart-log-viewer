'use client';

import { useEffect, useMemo, useState } from 'react';
import type { JetsonRelease } from '@/lib/jetson-release-catalog';

const HEALTH_ITEMS = [
  { label: 'Vision Confidence', value: '87%', badge: 'GOOD' },
  { label: 'Heartbeat', value: 'Stable', badge: '120 BPM' },
  { label: 'Link Integrity', value: '99.2%', badge: '14ms' },
  { label: 'SLAM / VIO', value: 'Tracking', badge: '8 closures' },
];

type InstallState = 'idle' | 'installing' | 'success' | 'error';

type HistoryEntry = {
  ts: string;
  action: 'INSTALL';
  version: string;
  status: 'success' | 'error' | 'in_progress';
};

type JetsonStatusResponse = {
  installedVersion: string;
  installState: InstallState;
  lastAction: string;
  history: HistoryEntry[];
};

/**
 * Why: operators need immediate clarity about the currently installed Jetson code version.
 * What: finds release metadata for a specific version in the loaded catalog.
 */
function getReleaseByVersion(releases: JetsonRelease[], version: string) {
  return releases.find((release) => release.version === version) || null;
}

export default function JetsonPcPage() {
  const [releases, setReleases] = useState<JetsonRelease[]>([]);
  const [installedVersion, setInstalledVersion] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [lastAction, setLastAction] = useState('Loading Jetson status...');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadError, setLoadError] = useState('');

  /**
   * Why: this page needs both catalog and current device state before enabling install actions.
   * What: fetches releases and status from API and syncs local UI state.
   */
  const loadStatus = async () => {
    const [releasesRes, statusRes] = await Promise.all([
      fetch('/api/jetson/releases', { cache: 'no-store' }),
      fetch('/api/jetson/status', { cache: 'no-store' }),
    ]);
    if (!releasesRes.ok || !statusRes.ok) {
      throw new Error('Jetson API is unavailable');
    }
    const releaseJson = (await releasesRes.json()) as { releases: JetsonRelease[] };
    const statusJson = (await statusRes.json()) as JetsonStatusResponse;
    const nextReleases = Array.isArray(releaseJson.releases) ? releaseJson.releases : [];
    setReleases(nextReleases);
    setInstalledVersion(statusJson.installedVersion || nextReleases[0]?.version || '');
    setTargetVersion((prev) => prev || statusJson.installedVersion || nextReleases[0]?.version || '');
    setInstallState(statusJson.installState || 'idle');
    setLastAction(statusJson.lastAction || 'Ready');
    setHistory(Array.isArray(statusJson.history) ? statusJson.history : []);
  };

  useEffect(() => {
    let active = true;
    loadStatus()
      .then(() => {
        if (active) setLoadError('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Failed loading Jetson status');
      });
    const timer = setInterval(() => {
      loadStatus().catch(() => {});
    }, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const installedRelease = useMemo(
    () => getReleaseByVersion(releases, installedVersion),
    [releases, installedVersion]
  );
  const selectedRelease = useMemo(
    () => getReleaseByVersion(releases, targetVersion),
    [releases, targetVersion]
  );
  const needsInstall = Boolean(targetVersion) && targetVersion !== installedVersion;

  /**
   * Why: give operators a single, low-friction action for upgrade or rollback.
   * What: calls the server install endpoint and refreshes UI from persisted device state.
   */
  const handleInstall = async () => {
    if (!needsInstall || installState === 'installing') return;
    setLoadError('');
    try {
      setInstallState('installing');
      setLastAction(`Installing ${targetVersion}...`);
      const response = await fetch('/api/jetson/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: targetVersion }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || `Install failed (${response.status})`);
      }
      await loadStatus();
    } catch (error: unknown) {
      setInstallState('error');
      setLoadError(error instanceof Error ? error.message : 'Install failed');
    }
  };

  return (
    <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight text-primary uppercase">JETSON_PC_STATUS</h1>
          <p className="font-label text-[10px] tracking-widest text-slate-400 mt-1 uppercase">
            Live runtime + version install manager
          </p>
        </div>
        <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-surface-container-high text-on-surface border border-outline-variant/40">
          Current: {installedVersion || 'N/A'}
        </span>
      </header>
      {loadError ? (
        <div className="border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-xs">
          {loadError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {HEALTH_ITEMS.map((item) => (
          <article key={item.label} className="bg-surface-container-lowest border border-outline-variant/20 p-4">
            <div className="flex items-center justify-between">
              <span className="font-label text-[10px] tracking-widest text-slate-500 uppercase">{item.label}</span>
              <span className="text-[9px] font-bold uppercase text-primary">{item.badge}</span>
            </div>
            <p className="mt-3 font-headline text-2xl font-black text-on-surface tracking-tight">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/20 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-headline text-xl font-black tracking-tight text-primary uppercase">Jetson Version Manager</h2>
            <span
              className={`text-[10px] px-2 py-1 font-bold uppercase border ${
                installState === 'installing'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : installState === 'error'
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-green-100 text-green-700 border-green-300'
              }`}
            >
              {installState === 'installing' ? 'INSTALLING' : installState === 'error' ? 'FAILED' : 'READY'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border border-outline-variant/20 bg-surface-container p-3">
              <p className="font-label text-[10px] tracking-widest text-slate-500 uppercase">Installed now</p>
              <p className="mt-2 font-headline text-2xl font-black text-on-surface">{installedVersion}</p>
              <p className="text-xs text-slate-500 mt-1">
                {installedRelease ? `${installedRelease.channel.toUpperCase()} · ${installedRelease.date}` : 'Unknown build'}
              </p>
              <p className="text-xs text-on-surface mt-2">
                {installedRelease?.notesHe || 'אין תיאור גרסה זמין'}
              </p>
            </div>

            <div className="rounded border border-outline-variant/20 bg-surface-container p-3">
              <label className="font-label text-[10px] tracking-widest text-slate-500 uppercase block mb-2" htmlFor="targetVersion">
                Install / Rollback to
              </label>
              <select
                id="targetVersion"
                className="w-full border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface"
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
              >
                {releases.map((release) => (
                  <option key={release.version} value={release.version}>
                    {release.version} ({release.channel})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {selectedRelease ? `${selectedRelease.date} · ${selectedRelease.notesEn}` : 'Unknown release'}
              </p>
              <button
                type="button"
                onClick={() => { handleInstall().catch(() => {}); }}
                disabled={!needsInstall || installState === 'installing'}
                className={`mt-3 w-full py-2 text-xs font-bold tracking-widest uppercase transition-colors ${
                  !needsInstall || installState === 'installing'
                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {!needsInstall ? 'ALREADY INSTALLED' : installState === 'installing' ? 'INSTALLING...' : 'INSTALL VERSION'}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">{lastAction || 'Select a version and click install.'}</p>
        </article>

        <article className="bg-surface-container-lowest border border-outline-variant/20 p-4">
          <h3 className="font-label text-[10px] tracking-widest text-slate-500 uppercase mb-3">Install history</h3>
          <div className="space-y-2">
            {history.map((row, idx) => (
              <div key={`${row.ts}-${idx}`} className="border border-outline-variant/20 bg-surface-container p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">{row.version}</span>
                  <span
                    className={`text-[9px] font-bold uppercase ${
                      row.status === 'success'
                        ? 'text-green-700'
                        : row.status === 'in_progress'
                          ? 'text-amber-700'
                          : 'text-red-700'
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{row.action} · {row.ts}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
