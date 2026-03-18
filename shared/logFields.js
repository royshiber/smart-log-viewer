/**
 * Common ArduPilot Plane log message types and field mappings
 * Used for presets and Gemini context
 */
export const PLANE_MESSAGE_TYPES = [
  'ATT', 'AHR2', 'CTUN', 'NTUN', 'BARO', 'GPS', 'IMU', 'MODE', 'MSG',
  'CMD', 'POS', 'BAT', 'RCIN', 'RCOU', 'RPM', 'VIBE', 'ARSP', 'AETR',
  'XKF1', 'XKF2', 'XKF3', 'XKF4', 'XKF5', 'NKF1', 'NKF2', 'NKF3',
  'NKF4', 'NKF5', 'NKF6', 'NKF7', 'NKF8', 'NKF9', 'NKF10',
  'PARM', 'EV', 'STAT', 'FILE', 'FMTU', 'FMT', 'UNIT', 'MULT'
];

export const COMMON_FIELD_ALIASES = {
  roll: ['Roll', 'NavRoll', 'DesRoll'],
  pitch: ['Pitch', 'NavPitch', 'DesPitch'],
  yaw: ['Yaw', 'DesYaw', 'NavYaw'],
  altitude: ['Alt', 'RelAlt', 'BarAlt', 'Alt'],
  speed: ['Spd', 'Aspd', 'GSpd', 'VSpd'],
  throttle: ['Thr', 'ThrOut', 'ThrIn'],
};
