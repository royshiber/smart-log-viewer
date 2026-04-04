# Desktop shortcut for mLRS Configurator (Matek mR900 / olliw42 mLRS stack).
# Target: start-mlrs-configurator.bat — opens TCP-WS bridge + Vite and browser :3020
# Icon: Lua/EdgeTX-style glyph from apps/mlrs-cli-console/public/mlrs-configurator.ico
$projectPath = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "mLRS Configurator.lnk"
$targetBat = Join-Path $projectPath "start-mlrs-configurator.bat"

if (-not (Test-Path $targetBat)) {
  Write-Error "Missing launcher: $targetBat"
  exit 1
}

$sourceIco = Join-Path $projectPath "apps\mlrs-cli-console\public\mlrs-configurator.ico"
if (-not (Test-Path $sourceIco)) {
  $buildScript = Join-Path $projectPath "scripts\build-mlrs-configurator-icon.ps1"
  if (Test-Path $buildScript) {
    Write-Host "Building icon: $buildScript"
    & $buildScript
  }
}

$safeIconDir = Join-Path $env:LOCALAPPDATA "SmartLogViewer"
New-Item -ItemType Directory -Path $safeIconDir -Force | Out-Null
if (Test-Path $sourceIco) {
  Copy-Item $sourceIco (Join-Path $safeIconDir "mlrs-configurator.ico") -Force
}
$iconPath = Join-Path $safeIconDir "mlrs-configurator.ico"

if (Test-Path $shortcutPath) {
  Remove-Item $shortcutPath -Force
}

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetBat
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = "mLRS Configurator desktop - olliw42 mLRS CLI + WiFi bridge (start-mlrs-configurator.bat)"
if (Test-Path $iconPath) {
  $shortcut.IconLocation = "$iconPath, 0"
}
$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
Write-Host "Target: $targetBat"
if (Test-Path $iconPath) {
  Write-Host "Icon: $iconPath"
}
