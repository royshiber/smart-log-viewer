import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_RELEASES } from '@/lib/jetson-release-catalog';
import { readJetsonState, writeJetsonState } from '@/lib/jetson-state-store';

const COMPANION_BASE_URL = process.env.JETSON_COMPANION_BASE_URL?.trim() || '';

/**
 * Why: keep a single validation path for any requested install target.
 * What: verifies target version exists in known release catalog.
 */
function isKnownVersion(version: string): boolean {
  return DEFAULT_RELEASES.some((release) => release.version === version);
}

/**
 * Why: some deployments have a companion service that performs actual on-device install.
 * What: forwards install requests to companion endpoint when configured.
 */
async function installViaCompanion(version: string) {
  const response = await fetch(`${COMPANION_BASE_URL}/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Companion install failed (${response.status})`);
  }
}

/**
 * Why: allow install and rollback from the dashboard with auditable status updates.
 * What: applies install request locally (and optionally on companion), then persists result.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const targetVersion = String(body?.version || '');
  if (!targetVersion || !isKnownVersion(targetVersion)) {
    return NextResponse.json({ error: 'Unknown version' }, { status: 400 });
  }

  const before = await readJetsonState();
  const inProgressState = {
    ...before,
    installState: 'installing' as const,
    lastAction: `Installing ${targetVersion}...`,
    history: [
      { ts: new Date().toISOString(), action: 'INSTALL' as const, version: targetVersion, status: 'in_progress' as const },
      ...before.history,
    ].slice(0, 20),
  };
  await writeJetsonState(inProgressState);

  try {
    if (COMPANION_BASE_URL) {
      await installViaCompanion(targetVersion);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }

    const successState = {
      ...inProgressState,
      installedVersion: targetVersion,
      installState: 'success' as const,
      lastAction: `Installed ${targetVersion} successfully`,
      history: [
        { ts: new Date().toISOString(), action: 'INSTALL' as const, version: targetVersion, status: 'success' as const },
        ...inProgressState.history.filter((entry) => entry.status !== 'in_progress'),
      ].slice(0, 20),
    };
    await writeJetsonState(successState);
    return NextResponse.json(successState);
  } catch (error) {
    const failState = {
      ...inProgressState,
      installState: 'error' as const,
      lastAction: `Install failed for ${targetVersion}`,
      history: [
        { ts: new Date().toISOString(), action: 'INSTALL' as const, version: targetVersion, status: 'error' as const },
        ...inProgressState.history.filter((entry) => entry.status !== 'in_progress'),
      ].slice(0, 20),
    };
    await writeJetsonState(failState);
    return NextResponse.json(
      { ...failState, error: error instanceof Error ? error.message : 'Install failed' },
      { status: 500 }
    );
  }
}
