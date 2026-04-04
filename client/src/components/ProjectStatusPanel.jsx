import { useEffect, useMemo, useState } from 'react';
import { fetchProjectStatus, saveProjectStatus } from '../api/projectStatus';

const STORAGE_KEY = 'visionLandingProjectStatusV1';

const STATUS_ORDER = ['not_started', 'in_progress', 'ready_for_review', 'closed'];
const SYSTEM_STATUS_LABELS = {
  he: {
    not_started: 'לא התחלנו',
    in_progress: 'בתהליך',
    ready_for_review: 'מוכן לבדיקה',
    closed: 'סגור',
  },
  en: {
    not_started: 'Not started',
    in_progress: 'In progress',
    ready_for_review: 'Ready for review',
    closed: 'Closed',
  },
};

const CONFIDENCE_LABELS = {
  he: { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' },
  en: { low: 'Low', medium: 'Medium', high: 'High' },
};

const CATEGORY_TITLES = {
  he: {
    platform: 'תשתית פלטפורמה',
    telemetry: 'טלמטריה ותצפית',
    vision: 'ראייה ממוחשבת',
    control: 'בקרה ובטיחות',
    ai: 'AI Copilot',
    validation: 'בדיקות והסמכה',
  },
  en: {
    platform: 'Platform core',
    telemetry: 'Telemetry and observability',
    vision: 'Computer vision',
    control: 'Control and safety',
    ai: 'AI Copilot',
    validation: 'Validation and qualification',
  },
};

const INITIAL_TASKS = [
  {
    id: 'capsule-a-core-runtime',
    category: 'platform',
    goal: { he: 'להפעיל את אותה אפליקציה גם בדפדפן וגם כ-Tauri Desktop.', en: 'Run the same app in browser and Tauri desktop.' },
    done: { he: 'מוגדר בתוכנית האב.', en: 'Defined in the master plan.' },
    remaining: { he: 'ליצור scaffold ראשוני ל-Web/Tauri עם API אחיד.', en: 'Create initial Web/Tauri scaffold with shared API.' },
    systemStatus: 'in_progress',
    confidence: 'medium',
    userDecision: 'follow_system',
  },
  {
    id: 'capsule-b-telemetry-bus',
    category: 'telemetry',
    goal: { he: 'לאחד טלמטריה והודעות מערכת לציר זמן אחד ברור.', en: 'Unify telemetry and system messages into one timeline.' },
    done: { he: 'דרישות UI וארכיטקטורה הוגדרו.', en: 'UI and architecture requirements defined.' },
    remaining: { he: 'לממש ingest + סינון + חיפוש + replay.', en: 'Implement ingest, filtering, search, and replay.' },
    systemStatus: 'not_started',
    confidence: 'low',
    userDecision: 'follow_system',
  },
  {
    id: 'capsule-c-vision-offset',
    category: 'vision',
    goal: { he: 'לחשב סטייה רוחבית ואיכות זיהוי למסלול ללא סמן.', en: 'Compute lateral offset and confidence for markerless runway.' },
    done: { he: 'הוגדר scope: lateral correction only.', en: 'Scope fixed to lateral correction only.' },
    remaining: { he: 'לבנות pipeline ראייה ולמדוד עמידות בתאורה משתנה.', en: 'Build vision pipeline and measure lighting robustness.' },
    systemStatus: 'not_started',
    confidence: 'low',
    userDecision: 'follow_system',
  },
  {
    id: 'capsule-d-safe-write',
    category: 'control',
    goal: { he: 'לאפשר שינוי פרמטרים מהיר בלי לפגוע בבטיחות טיסה.', en: 'Enable fast parameter writes without flight-safety risk.' },
    done: { he: 'נקבע מודל SafeRuntime/LockedInFlight + Override.', en: 'SafeRuntime/LockedInFlight plus override model defined.' },
    remaining: { he: 'לממש interlocks וכתיבה עם אישור מפורש בלבד.', en: 'Implement interlocks and explicit-approval writes.' },
    systemStatus: 'not_started',
    confidence: 'low',
    userDecision: 'follow_system',
  },
  {
    id: 'capsule-e-ai-copilot',
    category: 'ai',
    goal: { he: 'צ׳אט היברידי שמסביר קצר ומציע שיפורי פרמטרים.', en: 'Hybrid copilot chat with concise tuning suggestions.' },
    done: { he: 'הוגדרו Advisor/Suggestor + explain-before-apply.', en: 'Advisor/Suggestor plus explain-before-apply defined.' },
    remaining: { he: 'לחבר לקריאת טלמטריה מלאה ולמנגנון אישור דו-שלבי.', en: 'Wire to full telemetry read and two-step approvals.' },
    systemStatus: 'in_progress',
    confidence: 'medium',
    userDecision: 'follow_system',
  },
  {
    id: 'capsule-f-flight-qualification',
    category: 'validation',
    goal: { he: 'לעבור SITL/HIL ואז ניסויי שדה עד נחיתה אוטומטית מלאה.', en: 'Pass SITL/HIL then field tests toward full auto-landing.' },
    done: { he: 'הוגדרו שערי Go/No-Go עקרוניים.', en: 'Initial Go/No-Go gates are defined.' },
    remaining: { he: 'לסגור checklists מדידים ולהריץ סדרת ניסויים מדורגת.', en: 'Finalize measurable checklists and run staged tests.' },
    systemStatus: 'not_started',
    confidence: 'low',
    userDecision: 'follow_system',
  },
];

function getLanguage(isRtl) {
  return isRtl ? 'he' : 'en';
}

function localize(entry, lang) {
  return entry?.[lang] || entry?.he || entry?.en || '';
}

function effectiveStatus(task) {
  if (task.userDecision === 'mark_done') return 'closed';
  if (task.userDecision === 'mark_open' && task.systemStatus === 'closed') return 'in_progress';
  return task.systemStatus;
}

export function ProjectStatusPanel({ isRtl }) {
  const lang = getLanguage(isRtl);
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return INITIAL_TASKS;
  });
  const [activityLog, setActivityLog] = useState([]);
  const [syncState, setSyncState] = useState('idle');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const remote = await fetchProjectStatus();
        if (!active) return;
        if (Array.isArray(remote?.tasks) && remote.tasks.length) {
          setTasks(remote.tasks);
        }
        if (Array.isArray(remote?.activityLog)) {
          setActivityLog(remote.activityLog.slice(-200));
        }
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        setSyncState('saving');
        await saveProjectStatus({ tasks, activityLog });
        setSyncState('saved');
      } catch {
        setSyncState('offline');
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [tasks, activityLog]);

  const progress = useMemo(() => {
    const doneCount = tasks.filter((task) => effectiveStatus(task) === 'closed').length;
    return Math.round((doneCount / Math.max(tasks.length, 1)) * 100);
  }, [tasks]);

  const grouped = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.category] = acc[task.category] || [];
      acc[task.category].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const appendLog = (entry) => {
    setActivityLog((prev) => [...prev, { ts: new Date().toISOString(), ...entry }].slice(-200));
  };

  const setSystemStatus = (taskId, status) => {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== taskId) return task;
      if (task.systemStatus !== status) {
        appendLog({ taskId, type: 'system_status', from: task.systemStatus, to: status });
      }
      return { ...task, systemStatus: status };
    }));
  };

  const setUserDecision = (taskId, userDecision) => {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== taskId) return task;
      if (task.userDecision !== userDecision) {
        appendLog({ taskId, type: 'user_override', from: task.userDecision, to: userDecision });
      }
      return { ...task, userDecision };
    }));
  };

  const orderedCategories = Object.keys(grouped);

  return (
    <div className="h-full overflow-auto px-4 py-3 text-onSurface">
      <div className="mb-4 rounded-xl border border-border bg-surfaceRaised p-4">
        <p className="text-sm text-onSurface">
          {isRtl ? 'כאן רואים בצורה פשוטה מה הסטטוס של הפרויקט, מה נעשה ומה נשאר.' : 'This page shows clear non-technical project status, what is done, and what is left.'}
        </p>
        <p className="mt-1 text-xs text-muted">
          {isRtl ? 'סנכרון:' : 'Sync:'}{' '}
          {syncState === 'saving' ? (isRtl ? 'שומר...' : 'Saving...')
            : syncState === 'saved' ? (isRtl ? 'נשמר לשרת' : 'Saved to server')
              : syncState === 'offline' ? (isRtl ? 'מצב אופליין (נשמר מקומית)' : 'Offline mode (saved locally)')
                : (isRtl ? 'מוכן' : 'Ready')}
          {' · '}
          {isRtl ? 'אירועים מתועדים:' : 'Logged events:'} {activityLog.length}
        </p>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{isRtl ? 'התקדמות כוללת' : 'Overall progress'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded bg-black/30">
            <div className="h-2 rounded bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orderedCategories.map((category) => (
          <section key={category} className="rounded-xl border border-border bg-surfaceRaised p-3">
            <h2 className="text-sm font-semibold text-accent mb-3">
              {CATEGORY_TITLES[lang]?.[category] || category}
            </h2>
            <div className="space-y-3">
              {grouped[category].map((task) => {
                const currentStatus = effectiveStatus(task);
                return (
                  <article key={task.id} className="rounded-lg border border-border/70 bg-surface p-3">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <span className="text-xs text-muted">{task.id}</span>
                      <span className="text-xs px-2 py-0.5 border border-border bg-surfaceRaised text-onSurface">
                        {SYSTEM_STATUS_LABELS[lang][currentStatus]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm"><strong>{isRtl ? 'מטרה:' : 'Goal:'}</strong> {localize(task.goal, lang)}</p>
                    <p className="mt-1 text-sm text-green-800"><strong>{isRtl ? 'בוצע:' : 'Done:'}</strong> {localize(task.done, lang)}</p>
                    <p className="mt-1 text-sm text-amber-900"><strong>{isRtl ? 'נשאר:' : 'Remaining:'}</strong> {localize(task.remaining, lang)}</p>
                    <p className="mt-1 text-xs text-muted">
                      {isRtl ? 'רמת ביטחון:' : 'Confidence:'} {CONFIDENCE_LABELS[lang][task.confidence]}
                    </p>

                    <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-2">
                      <label className="text-xs text-onSurface flex flex-col gap-1">
                        <span>{isRtl ? 'System Assessment' : 'System Assessment'}</span>
                        <select
                          value={task.systemStatus}
                          onChange={(e) => setSystemStatus(task.id, e.target.value)}
                          className="rounded border border-border bg-surfaceRaised px-2 py-1 text-sm"
                        >
                          {STATUS_ORDER.map((status) => (
                            <option key={status} value={status}>
                              {SYSTEM_STATUS_LABELS[lang][status]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs text-onSurface flex flex-col gap-1">
                        <span>{isRtl ? 'User Override' : 'User Override'}</span>
                        <select
                          value={task.userDecision}
                          onChange={(e) => setUserDecision(task.id, e.target.value)}
                          className="rounded border border-border bg-surfaceRaised px-2 py-1 text-sm"
                        >
                          <option value="follow_system">{isRtl ? 'Follow system' : 'Follow system'}</option>
                          <option value="mark_open">{isRtl ? 'Mark as open' : 'Mark as open'}</option>
                          <option value="mark_done">{isRtl ? 'Mark as done' : 'Mark as done'}</option>
                        </select>
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
