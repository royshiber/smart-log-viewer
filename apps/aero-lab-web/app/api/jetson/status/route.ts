import { NextResponse } from 'next/server';
import { readJetsonState } from '@/lib/jetson-state-store';

/**
 * Why: operator console must show currently installed Jetson version in real time.
 * What: returns persisted install state and short installation history.
 */
export async function GET() {
  const state = await readJetsonState();
  return NextResponse.json(state);
}
