# Web + Tauri Runtime Plan

## Objective

Run one UI codebase in two modes:

- Web browser (remote/local server)
- Tauri desktop shell (local-first operations)

## Runtime Boundaries

- UI (`client`) talks only to backend HTTP API.
- Backend owns data persistence, project status, telemetry ingest, and write policies.
- Tauri mode wraps the same UI and points to local backend endpoint.

## Immediate Implementation Rules

1. No UI feature should depend on browser-only APIs without fallback.
2. All persistent project controls must go through backend routes when available.
3. If backend is unreachable, UI can temporarily store local state and show clear "offline" state.

## API Contracts Needed Early

- `GET /api/project-status`
- `PUT /api/project-status`
- `GET /api/health`

## Later Tauri Bootstrap

- Add `src-tauri` app shell.
- Bundle UI build artifacts into Tauri package.
- Configure auto-start option for local backend process.

## Delivery Note

This document is the capsule-A runtime baseline for Web + Tauri parity.
