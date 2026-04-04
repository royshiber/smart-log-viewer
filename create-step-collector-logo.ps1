$projectPath = $PSScriptRoot
$assetsDir = Join-Path $projectPath "step_collector\assets"
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null

$pngPath = Join-Path $assetsDir "step_collector_logo.png"
$icoPath = Join-Path $assetsDir "step_collector_logo.ico"

Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background gradient
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    [System.Drawing.Color]::FromArgb(18, 33, 64),
    [System.Drawing.Color]::FromArgb(23, 85, 142),
    45
)
$g.FillRectangle($bgBrush, $bgRect)

# Rounded card
$cardRect = New-Object System.Drawing.Rectangle(22, 22, 212, 212)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 36
$diameter = $radius * 2
$path.AddArc($cardRect.X, $cardRect.Y, $diameter, $diameter, 180, 90)
$path.AddArc($cardRect.Right - $diameter, $cardRect.Y, $diameter, $diameter, 270, 90)
$path.AddArc($cardRect.Right - $diameter, $cardRect.Bottom - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc($cardRect.X, $cardRect.Bottom - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 247, 252, 255))
$g.FillPath($cardBrush, $path)

# Cube-like STEP part
$cubePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 225, 247, 255), 7)
$cubePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$top = @(
    (New-Object System.Drawing.Point(78, 104)),
    (New-Object System.Drawing.Point(126, 74)),
    (New-Object System.Drawing.Point(178, 103)),
    (New-Object System.Drawing.Point(129, 133))
)
$left = @(
    (New-Object System.Drawing.Point(78, 104)),
    (New-Object System.Drawing.Point(78, 157)),
    (New-Object System.Drawing.Point(129, 188)),
    (New-Object System.Drawing.Point(129, 133))
)
$right = @(
    (New-Object System.Drawing.Point(129, 133)),
    (New-Object System.Drawing.Point(129, 188)),
    (New-Object System.Drawing.Point(178, 158)),
    (New-Object System.Drawing.Point(178, 103))
)
$faceBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 86, 192, 255))
$faceBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(165, 47, 141, 219))
$faceBrush3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170, 31, 108, 176))
$g.FillPolygon($faceBrush1, $top)
$g.FillPolygon($faceBrush2, $left)
$g.FillPolygon($faceBrush3, $right)
$g.DrawPolygon($cubePen, $top)
$g.DrawPolygon($cubePen, $left)
$g.DrawPolygon($cubePen, $right)

# Download arrow
$arrowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(238, 251, 255, 255), 10)
$arrowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$arrowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($arrowPen, 198, 82, 198, 145)
$g.DrawLine($arrowPen, 177, 127, 198, 148)
$g.DrawLine($arrowPen, 219, 127, 198, 148)
$trayPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(238, 251, 255, 255), 8)
$trayPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$trayPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($trayPen, 166, 170, 229, 170)

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Convert bitmap to icon
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

[System.Runtime.InteropServices.Marshal]::Release($hIcon) | Out-Null
$g.Dispose()
$bmp.Dispose()
$bgBrush.Dispose()
$cardBrush.Dispose()
$path.Dispose()
$cubePen.Dispose()
$faceBrush1.Dispose()
$faceBrush2.Dispose()
$faceBrush3.Dispose()
$arrowPen.Dispose()
$trayPen.Dispose()

Write-Host "Logo created:"
Write-Host "PNG: $pngPath"
Write-Host "ICO: $icoPath"
