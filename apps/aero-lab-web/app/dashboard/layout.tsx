'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

/**
 * Why: every dashboard route shares the Stitch “station” chrome.
 * What: reads pathname to highlight the active sidebar link.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/dashboard/telemetry';
  return <AppShell activeHref={pathname}>{children}</AppShell>;
}
