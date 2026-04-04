# Vision Landing Master Plan

## Goal

Build a full auto-landing capability for ArduPilot (Matek F405V2) with a Raspberry Pi 5 companion computer, where vision improves runway lateral alignment without requiring visual markers.

## Scope

- Pilot defines mission path and landing point.
- ArduPilot remains flight authority.
- Companion vision provides lateral correction and confidence.
- Laser rangefinder remains active in early phases for redundancy.
- No moving target in phase 1.

## Approved Defaults

1. Success criterion: lateral error up to `+-1.5m` for first 10 flights, then tighten to `+-1.0m`.
2. Auto abort if `vision_confidence` is low for more than `2s` below `20m`.
3. Laser rangefinder stays enabled in phase 1.
4. Camera setup is rigid, fixed exposure, no autofocus in flight.
5. PoC scope is lateral correction only.
6. In-flight writes allowed only for `SafeRuntime` parameters.
7. AI copilot can suggest only; writes require explicit user approval and parameter diff.
8. Single UI codebase runs as both Web and Tauri desktop.
9. First field campaign uses one fixed runway/road and fixed daylight windows.
10. New private GitHub repository with `main/dev/feature-*` and CI (`lint/test/build`).

## Delivery Capsules

### Capsule A - Platform Core

- Shared UI shell for Web + Tauri.
- Common API boundary for telemetry, status, and parameter write requests.
- Health checks and basic runtime diagnostics.

### Capsule B - Telemetry and Messages

- Unified ingest for telemetry and flight messages.
- Timeline view with filtering and search.
- Stable replay source for post-flight analysis.
- UDP bridge path from RPi companion into backend telemetry service.

### Capsule C - Vision Offset Engine

- Markerless runway/road centerline extraction.
- Lateral offset and heading error output.
- Confidence score with robust low-confidence handling.

### Capsule D - Safe Parameter Control

- Two-level parameter policy: `SafeRuntime` and `LockedInFlight`.
- Explain-then-approve write flow.
- Fast rollback to last known stable profile.

### Capsule E - AI Copilot

- Embedded chat for advisory analysis and tuning suggestions.
- Access to telemetry, messages, confidence, and recent logs.
- No automatic write execution.

### Capsule F - Flight Qualification

- SITL/HIL before field tests.
- Observe-only runs, then assisted runs, then full auto runs.
- Go/No-Go gates per stage.

## UI Requirements

### Project Status Tab

- Non-technical project status by capsule and task.
- Clear statements: goal, done, remaining, confidence.
- Dual status model:
  - `SystemAssessment` by tests and telemetry.
  - `UserDecision` via override control.
- User override is final authority.

### Operator Panel

- Real-time telemetry and message stream.
- Parameter read/write for allowed groups.
- Presets with versioned change history.

### ArduPilot Config Panel

- Dedicated UI tab for copy-ready ArduPilot parameter lines.
- One-click copy workflow for Mission Planner parameter loading.
- Initial baseline kept conservative (`PLND_ENABLED=0`) until SITL/HIL validation.

## Safety and Governance

- Hard confidence gating with fallback to mission guidance.
- No unapproved writes by AI or automation.
- Full audit trail for writes and overrides.
- Release gates required before each escalation level.

## ArduPilot Loadables

- Include a maintained config pack in:
  - `docs/ARDUPILOT_VISION_LANDING_CONFIG.md`
- UI must expose this pack in a dedicated tab for quick operator access.
- Companion telemetry bridge setup is documented in:
  - `docs/RPI_COMPANION_TELEMETRY_BRIDGE.md`
  - `docs/RPI_COMPANION_MAVLINK_BRIDGE_SETUP.md`

## GitHub and Process

- Track progress by capsules and small tasks.
- PR template includes safety impact and test evidence.
- Continuous integration blocks unsafe or broken changes.
- Changelog updated per release.
