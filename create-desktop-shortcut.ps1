# Creates a desktop shortcut for Smart Log Viewer
$projectPath = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Smart Log Viewer.lnk"

# Copy ICO to a path without Hebrew characters (Windows shortcut icon requires ASCII-safe path)
$safeIconDir = Join-Path $env:LOCALAPPDATA "SmartLogViewer"
$sourceIco   = Join-Path $projectPath "client\public\favicon.ico"
New-Item -ItemType Directory -Path $safeIconDir -Force | Out-Null
if (Test-Path $sourceIco) {
    Copy-Item $sourceIco "$safeIconDir\favicon.ico" -Force
}
$iconPath = "$safeIconDir\favicon.ico"

if (Test-Path $shortcutPath) { Remove-Item $shortcutPath -Force }

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = Join-Path $projectPath "start-log-viewer.bat"
$Shortcut.WorkingDirectory = $projectPath
$Shortcut.Description = "Smart Log Viewer - ArduPilot"

if (Test-Path $iconPath) {
    $Shortcut.IconLocation = "$iconPath, 0"
}

$Shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
if (Test-Path $iconPath) { Write-Host "Icon: $iconPath" }
