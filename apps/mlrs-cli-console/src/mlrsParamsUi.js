/**
 * Why: Users see "Tx Ser Dest = serial [0]" in log but may not know CLI key is tx_ser_dest.
 * What: Curated list mapping Hebrew labels to CLI parameter keys (underscore form per CLI.md). Values are user-typed; user should confirm with pl tx; output.
 */

/** @typedef {{ id: string, cliKey: string, labelHe: string, placeholder?: string, hintHe?: string }} QuickParam */

/** @type {QuickParam[]} */
export const MLRS_QUICK_PARAMS = [
  {
    id: 'tx_power',
    cliKey: 'tx_power',
    labelHe: 'הספק משדר (Tx Power)',
    placeholder: 'למשל 20',
    hintHe: 'בדרך כלל ב-dBm. אשר את הטווח המותר בפלט של pl tx;',
  },
  {
    id: 'rx_power',
    cliKey: 'rx_power',
    labelHe: 'הספק מקלט (Rx Power)',
    placeholder: 'למשל 10',
    hintHe: 'אשר ב-pl rx; כשיש לינק.',
  },
  {
    id: 'tx_ser_dest',
    cliKey: 'tx_ser_dest',
    labelHe: 'יעד סריאל משדר (Tx Ser Dest)',
    placeholder: 'למשל serial',
    hintHe: 'למשל serial עבור HC-04 — ראה MATEKSYS.md ו-PARAMETERS.md.',
  },
  {
    id: 'tx_ser_baudrate',
    cliKey: 'tx_ser_baudrate',
    labelHe: 'מהירות סריאל Tx (Tx Ser Baudrate)',
    placeholder: 'מספר אינדקס או ערך לפי pl tx',
    hintHe: 'המספרים בסוגריים בפלט pl הם אינדקסי אפשרויות.',
  },
  {
    id: 'bind_phrase',
    cliKey: 'bind_phrase',
    labelHe: 'ביטוי קישור (Bind Phrase)',
    placeholder: 'טקסט קישור',
    hintHe: 'חייב להתאים בין Tx ל-Rx; ראה BINDING.md.',
  },
  {
    id: 'custom',
    cliKey: '',
    labelHe: 'שם פרמטר מותאם (מתקדם)',
    placeholder: 'למשל tx_mav_component',
    hintHe: 'הקלד את שם ה-CLI המדויק (בקו תחתון), אחרת בחר מהרשימה למעלה.',
  },
];

/**
 * Why: Block injection and accidental multi-command in one line.
 * What: Keeps alnum, space, dot, dash, underscore for phrase-like values.
 * @param {string} raw
 */
export function sanitizeParamValue(raw) {
  return String(raw || '')
    .trim()
    .replace(/[\r\n;]/g, '')
    .slice(0, 120);
}
