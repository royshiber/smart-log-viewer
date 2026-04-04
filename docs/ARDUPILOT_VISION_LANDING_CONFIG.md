# ArduPilot Vision Landing Config Pack

## Purpose

This file defines a first-pass parameter pack to support:

- Companion computer link (`Raspberry Pi 5` -> ArduPilot)
- Reliable telemetry for a vision-assisted landing workflow
- Safe defaults for staged testing

## Important

- Apply on bench first, then SITL/HIL, only then field tests.
- Exact values may require tuning for your specific airframe and serial wiring.
- Keep laser rangefinder enabled in early phases.

## Parameter Set (copy-ready)

```text
# Companion link (example: SERIAL2 for RPi MAVLink)
SERIAL2_PROTOCOL,2
SERIAL2_BAUD,921

# Redundant telemetry stream rates for companion analysis
SR2_EXT_STAT,5
SR2_EXTRA1,10
SR2_EXTRA2,10
SR2_EXTRA3,5
SR2_POSITION,10
SR2_RAW_SENS,5
SR2_RC_CHAN,5

# Logging and diagnostics baseline
LOG_DISARMED,1
LOG_REPLAY,1
LOG_BACKEND_TYPE,1

# EKF/GPS robustness baseline (generic safe defaults)
EK3_ENABLE,1
AHRS_EKF_TYPE,3
GPS_AUTO_SWITCH,1

# Failsafe baseline (tune to platform policy)
FS_GCS_ENABLE,1
FS_OPTIONS,0

# Precision/Landing-Target pipeline placeholders
# NOTE: enable only after data path validation
PLND_ENABLED,0
PLND_TYPE,1
PLND_ORIENT,0
PLND_YAW_ALIGN,0
```

## How To Load

1. Open Mission Planner (or equivalent GCS).
2. Full Parameter Tree -> load/set values above.
3. Write params and reboot FC.
4. Verify companion heartbeat and telemetry arrival.
5. Keep `PLND_ENABLED=0` until companion output is validated in SITL/HIL.

## Next Iteration

- When companion lateral correction output is validated, switch the precision pipeline from placeholder to active mode.
- Add profile variants for:
  - Runway with markings
  - Low-contrast road
  - Dusk lighting
