import Link from 'next/link';

/**
 * Why: landing index for the scaffold — maps local Stitch exports to App Router paths.
 * What: static route table aligned with docs/stitch-aerolab/manifest.json screen names.
 */
export default function HomePage() {
  const routes = [
    { href: '/dashboard/tactical-precision', title: 'Option 5: Aero-Lab Tactical Precision', file: '01-option5-tactical-precision.html' },
    { href: '/dashboard/logs-notes', title: 'Logs & Notes - Aero-Lab v5', file: '02-logs-notes-v5.html' },
    { href: '/dashboard/jetson-pc', title: 'Jetson PC Status - Aero-Lab v5', file: '03-jetson-pc-status-v5.html' },
    { href: '/dashboard/logs-style', title: 'Logs & Notes - Aero-Lab Style', file: '04-logs-notes-style.html' },
    { href: '/dashboard/landing-flow', title: 'Landing Flow - Aero-Lab v5', file: '05-landing-flow-v5.html' },
    { href: '/dashboard/telemetry', title: 'Extended Telemetry - Aero-Lab Style (dashboard)', file: '06-extended-telemetry-style.html' },
  ];
  return (
    <div className="p-10 max-w-3xl mx-auto font-body">
      <h1 className="font-headline text-3xl font-black text-primary mb-2">Aero-Lab — Stitch routes</h1>
      <p className="text-sm text-on-surface-variant mb-8">
        Project ID <code className="bg-surface-container px-1">4104598718881540433</code> — primary operator dashboard:{' '}
        <Link className="text-primary font-semibold underline" href="/dashboard/telemetry">
          /dashboard/telemetry
        </Link>
      </p>
      <ul className="space-y-3 border border-outline-variant/30 p-4 bg-surface-container-low">
        {routes.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="text-primary font-label font-bold text-sm hover:underline">
              {r.title}
            </Link>
            <span className="text-xs text-on-surface-variant mr-2"> — {r.file}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
