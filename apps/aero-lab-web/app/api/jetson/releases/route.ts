import { NextResponse } from 'next/server';
import { DEFAULT_RELEASES } from '@/lib/jetson-release-catalog';

/**
 * Why: UI needs a canonical list for upgrade and rollback options.
 * What: returns Jetson release catalog from server-side source of truth.
 */
export async function GET() {
  return NextResponse.json({ releases: DEFAULT_RELEASES });
}
