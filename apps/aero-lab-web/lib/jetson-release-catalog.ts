export type JetsonRelease = {
  version: string;
  channel: 'stable' | 'legacy';
  date: string;
  notesHe: string;
  notesEn: string;
};

export const DEFAULT_RELEASES: JetsonRelease[] = [
  {
    version: '1.02.57',
    channel: 'stable',
    date: '2026-04-03',
    notesHe: 'ניהול גרסאות Jetson + מסך סטטוס חי',
    notesEn: 'Jetson version manager + live status screen',
  },
  {
    version: '1.02.56',
    channel: 'stable',
    date: '2026-04-03',
    notesHe: 'שיפור telemetry bridge ויציבות כללית',
    notesEn: 'Telemetry bridge and runtime stability improvements',
  },
  {
    version: '1.02.54',
    channel: 'stable',
    date: '2026-03-25',
    notesHe: 'יישור עיצוב Aero-Lab',
    notesEn: 'Aero-Lab design alignment',
  },
  {
    version: '1.02.50',
    channel: 'legacy',
    date: '2026-03-24',
    notesHe: 'גרסת Rollback בטוחה',
    notesEn: 'Known-good rollback baseline',
  },
];
