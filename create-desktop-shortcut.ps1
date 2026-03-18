# Creates a desktop shortcut for Smart Log Viewer
$projectPath = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Smart Log Viewer.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = Join-Path $projectPath "start-log-viewer.bat"
$Shortcut.WorkingDirectory = $projectPath
$Shortcut.Description = "Smart Log Viewer - ArduPilot"
$Shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
