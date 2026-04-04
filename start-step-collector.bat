@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo [STEP Collector] Virtual environment not found. Creating .venv...
  py -3 -m venv .venv
)

echo [STEP Collector] Installing/updating dependencies...
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
".venv\Scripts\python.exe" -m pip install -r "step_collector\requirements.txt"

echo [STEP Collector] Ensuring Playwright Chromium is installed...
".venv\Scripts\python.exe" -m playwright install chromium

if not exist ".env" (
  echo [STEP Collector] .env not found. Creating from template...
  copy /Y "step_collector\.env.example" ".env" >nul
  echo [STEP Collector] Please edit .env with your GrabCAD/TraceParts credentials.
)

echo [STEP Collector] Launching app...
".venv\Scripts\python.exe" -m step_collector.main
