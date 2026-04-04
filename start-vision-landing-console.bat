@echo off
chcp 65001 >nul
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

REM ---------------------------------------------------------------------------
REM Vision Landing Console launcher (NOT the Smart Log Viewer on :5173).
REM - If vision-landing-console-home.txt exists here with ONE line = folder path
REM   that contains YOUR real server.js, we run: node server.js from that folder.
REM - Otherwise we fall back to the small scaffold in apps\vision-landing-console.
REM Copy vision-landing-console-home.EXAMPLE.txt -> vision-landing-console-home.txt
REM ---------------------------------------------------------------------------

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

set "HOME_FILE=%PROJECT_DIR%vision-landing-console-home.txt"
set "VISION_EXT_ROOT="
if exist "%HOME_FILE%" (
  set /p VISION_EXT_ROOT=<"%HOME_FILE%"
)

if defined VISION_EXT_ROOT (
  if exist "%VISION_EXT_ROOT%\server.js" (
    echo [Vision Landing Console] External project: %VISION_EXT_ROOT%
    start "Vision Landing Console" cmd /k "cd /d ""%VISION_EXT_ROOT%"" && node server.js"
    echo Waiting for server...
    timeout /t 3 /nobreak >nul
    start http://localhost:4010
    exit /b 0
  )
  if exist "%HOME_FILE%" (
    echo [Vision Landing Console] vision-landing-console-home.txt is set but server.js not found:
    echo   %VISION_EXT_ROOT%
    echo Fix the path or remove the file to use the in-repo scaffold.
    pause
    exit /b 1
  )
)

REM --- In-repo scaffold (minimal UI; NOT the full Parameter Center app) ---
if not exist "apps\vision-landing-console\node_modules" (
  echo [Vision Landing Console] Installing scaffold dependencies...
  call npm install --prefix apps\vision-landing-console
)

echo [Vision Landing Console] Starting IN-REPO scaffold on port 4010...
echo If you expected the full console, create vision-landing-console-home.txt — see vision-landing-console-home.EXAMPLE.txt
start "Vision Landing Console (scaffold)" cmd /k "cd /d ""%PROJECT_DIR:~0,-1%"" && npm run start --prefix apps\vision-landing-console"

echo Waiting for server...
timeout /t 3 /nobreak >nul

start http://localhost:4010
