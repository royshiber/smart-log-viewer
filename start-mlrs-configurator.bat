@echo off
chcp 65001 >nul
REM Desktop shortcut + icon: run create-mlrs-configurator-shortcut.ps1 from repo root (once).
REM AI chat (tab "עוזר mLRS"): in another terminal run from repo root: npm run dev:server
REM   + set GEMINI_API_KEY in server/.env — Vite proxies /api to :3001
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

for %%P in ("C:\Program Files\nodejs" "%LOCALAPPDATA%\Programs\nodejs" "%APPDATA%\nvm\current" "%ProgramFiles%\nodejs") do (
  if exist "%%~P\npm.cmd" (
    set "PATH=%%~P;%PATH%"
    goto :path_found
  )
)
:path_found

where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo Node.js/npm not found. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "apps\mlrs-cli-console\node_modules" (
  echo [mLRS Configurator] Installing dependencies...
  call npm install --prefix apps\mlrs-cli-console
)

echo [mLRS Configurator] Starting TCP bridge + Vite (WiFi path uses WS ws://127.0.0.1:13765)
echo Set MLRS_TCP_HOST / MLRS_TCP_PORT if your mLRS WiFi AP uses non-default IP.
start "mLRS TCP-WS bridge" cmd /k "cd /d ""%PROJECT_DIR:~0,-1%"" && npm run bridge --prefix apps\mlrs-cli-console"

timeout /t 2 /nobreak >nul

start "mLRS Configurator" cmd /k "cd /d ""%PROJECT_DIR:~0,-1%"" && npm run dev --prefix apps\mlrs-cli-console"

timeout /t 3 /nobreak >nul
start http://localhost:3020
