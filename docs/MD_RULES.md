# MD Rules for Project Order

## Purpose

This file defines how implementation work is documented and reviewed to keep the project understandable and controlled.

## Function Documentation Rule

- Every new function must include a short nearby note:
  - Why it was added.
  - What it does.
- When editing a function, verify the note still matches real behavior.

## Edit Session Review Rule

Before finishing a coding session:

1. Re-open changed files.
2. Verify each new/changed function still makes operational sense.
3. Ensure there is no stale comment that contradicts runtime behavior.

## Safety Review Rule

- Any logic affecting flight behavior, telemetry interpretation, or parameter write flow must include a concise safety rationale.

## Project Tracking Rule

- If a change introduces follow-up work, add a task to `docs/TASK_BACKLOG.md`.
- If a substantial feature is added, update `client/src/version.js`.
