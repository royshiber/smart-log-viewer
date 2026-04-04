$projectPath = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Desktop STEP Collector.lnk"
$targetBat = Join-Path $projectPath "start-step-collector.bat"
$iconPath = Join-Path $projectPath "step_collector\assets\step_collector_logo.ico"

if (-not (Test-Path $targetBat)) {
    Write-Error "Missing launcher: $targetBat"
    exit 1
}

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
}

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetBat
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = "Desktop STEP Collector"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath, 0"
}
$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
