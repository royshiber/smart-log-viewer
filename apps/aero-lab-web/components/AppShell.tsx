import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/dashboard/tactical-precision', label: 'TACTICAL' },
  { href: '/dashboard/logs-notes', label: 'LOGS_V5' },
  { href: '/dashboard/jetson-pc', label: 'JETSON' },
  { href: '/dashboard/logs-style', label: 'LOGS_STYLE' },
  { href: '/dashboard/landing-flow', label: 'LANDING' },
  { href: '/dashboard/telemetry', label: 'TELEMETRY' },
] as const;

/**
 * Why: mirrors Stitch screen shell (top bar + fixed RTL sidebar) from 06-extended-telemetry-style.html.
 * What: persistent chrome for all /dashboard/* routes; children render the screen body.
 */
export function AppShell({
  children,
  activeHref,
}: {
  children: ReactNode;
  activeHref: string;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <header className="bg-slate-50 flex justify-between items-center w-full px-6 h-14 rtl:flex-row-reverse fixed top-0 z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black tracking-widest text-primary font-headline">
            DRONE_OS_V4
          </Link>
          <nav className="hidden md:flex gap-6 items-center h-full">
            <span className="font-['Space_Grotesk'] tracking-tighter uppercase text-xs font-bold text-slate-500">
              SENSORS
            </span>
            <span className="font-['Space_Grotesk'] tracking-tighter uppercase text-xs font-bold text-slate-500">
              UAV_STATUS
            </span>
            <span className="font-['Space_Grotesk'] tracking-tighter uppercase text-xs font-bold text-primary border-b-2 border-primary pb-1">
              NETWORK
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-highest px-3 py-1.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">search</span>
            <input
              className="bg-transparent border-none text-[10px] font-label focus:ring-0 uppercase tracking-widest w-32 text-on-surface"
              placeholder="QUERY_ID..."
              type="text"
              readOnly
              aria-label="Query id"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" className="p-2 hover:bg-slate-200/50 transition-colors duration-150" aria-label="Components">
              <span className="material-symbols-outlined">settings_input_component</span>
            </button>
            <button type="button" className="p-2 hover:bg-slate-200/50 transition-colors duration-150" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications_active</span>
            </button>
            <button type="button" className="p-2 hover:bg-slate-200/50 transition-colors duration-150" aria-label="Account">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <aside className="bg-[#f2f4f7] flex flex-col h-screen fixed right-0 top-0 z-40 w-64 border-l border-outline-variant/10 rtl:right-0">
        <div className="p-6 pt-20 border-b border-outline-variant/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white">account_circle</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-xs tracking-widest text-primary">ALPHA_STATION</h3>
              <p className="font-label text-[10px] text-slate-500">COORD: 34.0522 N</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-4 overflow-y-auto">
          {NAV.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-4 px-6 py-4 transition-all duration-75 cursor-crosshair border-r-4 ${
                  active
                    ? 'bg-[#e0e3e6] text-primary border-r-primary'
                    : 'text-slate-500 hover:bg-[#e0e3e6] border-r-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">settings_input_antenna</span>
                <span className="font-['Space_Grotesk'] text-[10px] font-bold tracking-[0.05rem] uppercase">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6">
          <button
            type="button"
            className="w-full py-4 bg-secondary text-on-secondary font-headline font-black text-xs tracking-[0.2rem] uppercase hover:opacity-95 transition-opacity"
          >
            EMERGENCY_STOP
          </button>
        </div>
      </aside>

      <main className="mr-64 pt-14 min-h-screen overflow-y-auto bg-surface relative">
        <div className="grain-texture absolute inset-0 pointer-events-none" aria-hidden />
        {children}
      </main>

      <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-2">
        <button
          type="button"
          className="bg-primary text-on-primary p-4 shadow-xl flex items-center gap-3 hover:opacity-95 transition-opacity"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_arrow
          </span>
          <span className="font-headline font-bold text-xs tracking-widest uppercase">INIT_MISSION</span>
        </button>
        <button
          type="button"
          className="bg-surface-container-highest text-on-surface p-4 border border-outline-variant/30 flex items-center gap-3 hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">save</span>
          <span className="font-headline font-bold text-xs tracking-widest uppercase">LOG_SNAP</span>
        </button>
      </div>
    </div>
  );
}
