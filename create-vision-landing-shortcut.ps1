# Vision landing (image) shortcut — NOT Smart Log Viewer.
# Runs: start-vision-landing-console.bat (:4010)
# Hebrew filename built from char codes so the script stays ASCII-safe on Windows.
$projectPath = $PSScriptRoot
$desktopPath = [Environment]::GetFolderPath("Desktop")

# "נחיתה לפי תמונה" (UTF-16 code units)
$heName = -join @(
  [char]0x05E0, [char]0x05D7, [char]0x05D9, [char]0x05EA, [char]0x05D4, [char]0x0020,
  [char]0x05DC, [char]0x05E4, [char]0x05D9, [char]0x0020,
  [char]0x05EA, [char]0x05DE, [char]0x05D5, [char]0x05E0, [char]0x05D4
)
$shortcutPath = Join-Path $desktopPath ($heName + ".lnk")
$targetBat = Join-Path $projectPath "start-vision-landing-console.bat"

if (-not (Test-Path $targetBat)) {
    Write-Error "Missing launcher: $targetBat"
    exit 1
}

$safeIconDir = Join-Path $env:LOCALAPPDATA "SmartLogViewer"
$sourceIco = Join-Path $projectPath "client\public\favicon.ico"
New-Item -ItemType Directory -Path $safeIconDir -Force | Out-Null
if (Test-Path $sourceIco) {
    Copy-Item $sourceIco (Join-Path $safeIconDir "favicon.ico") -Force
}
$iconPath = Join-Path $safeIconDir "favicon.ico"

$legacy = Join-Path $desktopPath "Vision Landing Console.lnk"
if (Test-Path $legacy) { Remove-Item $legacy -Force }

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
}

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetBat
$shortcut.WorkingDirectory = $projectPath
$shortcut.Description = "Vision landing (image) :4010 - NOT Log Viewer - vision-landing-console-home.txt"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath, 0"
}
$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
Write-Host "Target: $targetBat"
if (Test-Path $iconPath) { Write-Host "Icon: $iconPath" }
