import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_RELEASES } from '@/lib/jetson-release-catalog';

export type InstallHistoryEntry = {
  ts: string;
  action: 'INSTALL';
  version: string;
  status: 'success' | 'error' | 'in_progress';
};

export type JetsonState = {
  installedVersion: string;
  installState: 'idle' | 'installing' | 'success' | 'error';
  lastAction: string;
  history: InstallHistoryEntry[];
};

const STATE_DIR = join(process.cwd(), '.runtime');
const STATE_FILE = join(STATE_DIR, 'jetson-state.json');

const DEFAULT_STATE: JetsonState = {
  installedVersion: DEFAULT_RELEASES[0].version,
  installState: 'idle',
  lastAction: 'Ready',
  history: [],
};

/**
 * Why: route handlers need persistent Jetson state across requests/restarts.
 * What: reads the runtime JSON state file or returns defaults when absent/corrupt.
 */
export async function readJetsonState(): Promise<JetsonState> {
  try {
    const raw = await readFile(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as JetsonState;
    if (!parsed?.installedVersion) return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

/**
 * Why: install and status APIs must expose a single source of truth to operators.
 * What: writes the latest Jetson state snapshot to local runtime storage.
 */
export async function writeJetsonState(state: JetsonState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}
