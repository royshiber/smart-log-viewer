/**
 * Why: primary Stitch “TELEMETRY_STATION” dashboard — bento + terrain section from export.
 * What: JSX port of docs/stitch-aerolab/06-extended-telemetry-style.html main canvas (structure + classes preserved).
 */
export default function TelemetryDashboardPage() {
  return (
    <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight text-primary">TELEMETRY_DASHBOARD</h1>
          <p className="font-label text-[10px] tracking-widest text-slate-400 mt-1 uppercase">
            Live Stream • ALPHA_STATION_01 • Session: 492-X
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="font-label text-[10px] text-slate-400 uppercase">System Integrity</span>
            <span className="font-headline font-bold text-primary text-xl tracking-tighter">99.98%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 bg-surface-container-low p-4 flex flex-col justify-between border-r-4 border-primary">
          <div className="flex justify-between items-start">
            <span className="font-label text-[10px] font-bold tracking-widest text-slate-500 uppercase">Connection Status</span>
            <span className="material-symbols-outlined text-primary text-sm">wifi</span>
          </div>
          <div className="mt-4">
            <span className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">DUMMY</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-label text-[10px] text-primary uppercase">Active Uplink</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface-container-lowest p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-label text-[10px] font-bold tracking-widest text-slate-500 uppercase">Vision Confidence</span>
            <span className="material-symbols-outlined text-slate-400 text-sm">visibility</span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-4xl font-black text-on-surface">73</span>
              <span className="font-headline text-lg font-bold text-slate-400">%</span>
            </div>
            <div className="w-full bg-surface-container h-1 mt-2">
              <div className="bg-primary h-full w-[73%]" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-secondary-fixed p-4 flex flex-col justify-between border-r-4 border-secondary">
          <div className="flex justify-between items-start">
            <span className="font-label text-[10px] font-bold tracking-widest text-on-secondary-fixed uppercase">Auto Abort</span>
            <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
          </div>
          <div className="mt-4">
            <span className="font-headline text-2xl font-bold text-on-secondary-container uppercase tracking-tighter">ARMED</span>
            <p className="font-label text-[10px] text-secondary-container mt-1 uppercase font-bold">Countdown: 0s</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-surface-container-lowest p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-label text-[10px] font-bold tracking-widest text-slate-500 uppercase">Heartbeat</span>
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-8 flex items-end gap-[2px]">
              <div className="w-1 bg-primary/20 h-4" />
              <div className="w-1 bg-primary/40 h-6" />
              <div className="w-1 bg-primary/20 h-3" />
              <div className="w-1 bg-primary h-8" />
              <div className="w-1 bg-primary/60 h-5" />
              <div className="w-1 bg-primary/30 h-4" />
            </div>
            <span className="font-headline text-xl font-bold text-on-surface">
              122<span className="text-[10px] ml-1 text-slate-400">BPM</span>
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-primary-fixed p-6 flex flex-col justify-center items-center gap-4">
          <span className="font-label text-[10px] font-black tracking-[0.2rem] text-on-primary-fixed-variant uppercase">Takeoff Readiness</span>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">flight_takeoff</span>
            </div>
            <span className="font-headline text-4xl font-black text-on-primary-fixed tracking-widest">READY</span>
          </div>
          <p className="font-label text-[10px] text-on-primary-fixed-variant opacity-60">ALL SYSTEMS NOMINAL</p>
        </div>

        <div className="lg:col-span-4 bg-surface-container p-6 space-y-4">
          <div className="flex justify-between border-b border-outline-variant/30 pb-2">
            <span className="font-label text-[10px] text-slate-500 uppercase">Last Refresh</span>
            <span className="font-label text-[10px] font-bold text-on-surface uppercase">0.04s AGO</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant/30 pb-2">
            <span className="font-label text-[10px] text-slate-500 uppercase">Events Count</span>
            <span className="font-label text-[10px] font-bold text-on-surface uppercase">1,244 PROC</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant/30 pb-2">
            <span className="font-label text-[10px] text-slate-500 uppercase">Data Throughput</span>
            <span className="font-label text-[10px] font-bold text-on-surface uppercase">42.8 MB/S</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container-highest p-4 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[120px]">
            <span className="font-label text-[10px] font-bold text-primary uppercase tracking-widest">Signal_Map</span>
            <div className="grid grid-cols-6 gap-2 opacity-60">
              <div className="h-8 bg-primary" />
              <div className="h-12 bg-primary-container" />
              <div className="h-6 bg-primary" />
              <div className="h-14 bg-primary-container" />
              <div className="h-4 bg-primary" />
              <div className="h-10 bg-primary-container" />
            </div>
          </div>
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-headline font-bold text-xs tracking-widest text-primary uppercase">Terrain Map Navigation</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 bg-surface-container-high font-label text-[10px] font-bold text-slate-600 hover:bg-surface-container-highest uppercase"
            >
              Sat_View
            </button>
            <button type="button" className="px-3 py-1 bg-primary text-on-primary font-label text-[10px] font-bold hover:opacity-90 uppercase">
              Topo_View
            </button>
          </div>
        </div>
        <div className="relative h-96 w-full bg-slate-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="w-full h-full object-cover grayscale opacity-80"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaCh2kXNuuR0QtUbI5APakxmhXiEkoyQVfvJgnW8vyhr6Dn9LLpN6iW03NvU5RjSXGHTwyWM1728iz1OlDjl4qpXG8AzCEkjtKZjwnpy-mLtbPi9nwn25Tgzitt6u6AS6FD1HliYgVVFrpsURbmWqfDQOcbxbn71ztlaPvPdvFZTyhajbU11PVNd6b94T0X15oCxu4G6oXO0TGl9-vnAyLnAto1a17v_Pt7pHvdyUr0J4No1WeexefI42nDhZ3fqnEl8Ykc1PuDvc"
          />
          <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
            <div className="flex justify-between">
              <div className="p-4 glass-panel border border-primary/20">
                <span className="font-label text-[10px] text-primary font-bold uppercase block mb-1">Target_Vector</span>
                <span className="font-headline text-2xl font-black text-on-surface">244.5° NW</span>
              </div>
              <div className="p-4 glass-panel border border-primary/20 flex flex-col gap-2">
                <div className="flex items-center gap-4 justify-between">
                  <span className="font-label text-[10px] text-slate-500 uppercase">Altitude</span>
                  <span className="font-label text-[10px] font-bold text-on-surface">1,400 M</span>
                </div>
                <div className="flex items-center gap-4 justify-between">
                  <span className="font-label text-[10px] text-slate-500 uppercase">Ground Speed</span>
                  <span className="font-label text-[10px] font-bold text-on-surface">88 KM/H</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative w-16 h-16 border-2 border-primary/40 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-1 h-1 bg-primary rounded-full" />
                <div className="absolute w-20 h-[1px] bg-primary/20 rotate-45" />
                <div className="absolute w-20 h-[1px] bg-primary/20 -rotate-45" />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="font-label text-[10px] text-on-surface bg-surface-container-low/90 p-2 border border-outline-variant/20 uppercase">
                Lat: 45.122 // Long: 6.128 // HDG: 012
              </div>
              <div className="flex gap-2 pointer-events-auto">
                <button type="button" className="p-2 glass-panel border border-primary/20 hover:bg-primary hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined">add</span>
                </button>
                <button type="button" className="p-2 glass-panel border border-primary/20 hover:bg-primary hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined">remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
