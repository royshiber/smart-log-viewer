# Koyeb Public Deployment (Isolated from Local Dev)

This guide deploys the app as one public web service (frontend + API) without changing your local `localhost:5173` workflow.

## Why this is isolated

- Local development still runs with `npm run dev`.
- Cloud deployment uses `Dockerfile` only.
- Cloud secrets are set in Koyeb environment variables, not in local `.env`.

## 1) Prepare repository

- Push your branch to GitHub.
- Make sure `Dockerfile` and `.dockerignore` are included.

## 2) Create app in Koyeb

1. Open [Koyeb control panel](https://app.koyeb.com/).
2. Create a new **Web Service** from your GitHub repository.
3. Build method: **Dockerfile** (root `Dockerfile`).
4. Port: `8000` (container exposes this by default).

## 3) Set environment variables in Koyeb

Required:
- `GEMINI_API_KEY` = your real key

Optional:
- `GEMINI_MODEL` = `gemini-2.5-flash`

Do not set `PORT` manually unless you have a custom reason; platform-managed `PORT` is already supported by the server.

## 4) Health check

Use:
- Path: `/api/health`
- Expected: HTTP `200`

## 5) Verify after deployment

- Open your public Koyeb URL.
- Confirm app UI loads.
- Confirm API health: `<your-public-url>/api/health` returns `{ "ok": true }`.
- In app, test one AI action (chat/report) to verify `GEMINI_API_KEY` is configured.

## 6) Local dev remains unchanged

- Continue local run with:
  - `npm run dev`
- No local files need editing for cloud deployment.
