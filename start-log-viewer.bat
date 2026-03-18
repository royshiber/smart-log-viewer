@echo off
chcp 65001 >nul
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

REM Add Node.js to PATH when not in default (e.g. when launched from shortcut)
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

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)
if not exist "client\node_modules" (
  cd "%PROJECT_DIR%client"
  call npm install
  cd /d "%PROJECT_DIR%"
)
if not exist "server\node_modules" (
  cd "%PROJECT_DIR%server"
  call npm install
  cd /d "%PROJECT_DIR%"
)

echo Starting Smart Log Viewer...
start "Log Viewer Server" cmd /k "cd /d ""%PROJECT_DIR:~0,-1%"" && npm run dev"

echo Waiting for server to start...
timeout /t 10 /nobreak >nul

echo Opening browser...
start http://localhost:5173
