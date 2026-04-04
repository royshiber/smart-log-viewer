# Builds apps/mlrs-cli-console/public/mlrs-configurator.ico
# Visual language matches olliw42/mLRS lua/mLRS.lua (EdgeTX-style title bar + accent orange on dark grey).
# Requires Windows PowerShell 5.x+ with System.Drawing (full .NET Framework).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$size = 64
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(0x2b, 0x2e, 0x30))

$barH = [int][Math]::Ceiling($size * 0.22)
$barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0x45, 0x49, 0x4e))
$g.FillRectangle($barBrush, 0, 0, $size, $barH)

$accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0xf4, 0xaf, 0x2a))
$fontPx = [Math]::Max(9, [int]($size * 0.19))
$font = New-Object System.Drawing.Font "Segoe UI", $fontPx, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString("mLRS", $font, $accent, 3, 1)

$penW = [Math]::Max(1.5, $size / 28.0)
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(0xf4, 0xaf, 0x2a)), $penW
$cx = $size / 2.0
$cy = $size * 0.68
foreach ($rMul in @(0.14, 0.24, 0.34)) {
  $r = $size * $rMul
  $g.DrawArc($pen, [float]($cx - $r), [float]($cy - $r), [float](2 * $r), [float](2 * $r), 200, 140)
}

$g.Dispose()
$font.Dispose()
$barBrush.Dispose()
$accent.Dispose()
$pen.Dispose()

$projectRoot = Split-Path $PSScriptRoot -Parent
$icoPath = Join-Path $projectRoot "apps\mlrs-cli-console\public\mlrs-configurator.ico"
$dir = Split-Path $icoPath -Parent
if (-not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$handle = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($handle)
try {
  $fs = [System.IO.File]::Create($icoPath)
  try {
    $icon.Save($fs)
  } finally {
    $fs.Close()
  }
} finally {
  $icon.Dispose()
  $bmp.Dispose()
}

Write-Host "Wrote $icoPath"
