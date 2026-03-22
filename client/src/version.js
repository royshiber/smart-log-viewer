/** App version - increment on each change */
export const APP_VERSION = '1.02.40';

/** What's new in this version (numbered list for popup) */
export const VERSION_WHATS_NEW = {
  he: `1. ביצועים: עדכון נתוני לוג אחרי פרסור ב-startTransition + requestAnimationFrame — מפחית "הדף אינו מגיב" בלוגים גדולים
2. אותו דבר להשוואות (comparison layers); הוסרו לוגי דיבוג זמניים`,
  en: `1. Performance: apply parsed log data via startTransition + requestAnimationFrame — reduces "Page unresponsive" on large BINs
2. Same for comparison layers; removed temporary debug logging`,
};
