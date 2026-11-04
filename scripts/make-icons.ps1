param()
Add-Type -AssemblyName System.Drawing

function GenerateIcon {
    param(
        [int]$size,
        [string]$filename
    )
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(15, 23, 42)), ([System.Drawing.Color]::FromArgb(9, 13, 22)), 45.0
    $g.FillRectangle($brush, $rect)

    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(56, 189, 248)), ([Math]::Max(4, [int]($size / 30)))
    $pad = [int]($size * 0.04)
    $g.DrawRectangle($pen, $pad, $pad, ($size - 2*$pad), ($size - 2*$pad))

    $accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(37, 99, 235))
    $badgeY = [int]($size * 0.70)
    $badgeH = [int]($size * 0.16)
    $badgeX = [int]($size * 0.15)
    $badgeW = [int]($size * 0.70)
    $g.FillRectangle($accentBrush, $badgeX, $badgeY, $badgeW, $badgeH)

    $fontSize = [float]($size * 0.36)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF(0, [float]($size * 0.12), [float]$size, [float]($size * 0.55))
    $g.DrawString("PM", $font, $textBrush, $textRect, $sf)

    $subFontSize = [float]($size * 0.07)
    $subFont = New-Object System.Drawing.Font("Arial", $subFontSize, [System.Drawing.FontStyle]::Bold)
    $subRect = New-Object System.Drawing.RectangleF([float]$badgeX, [float]$badgeY, [float]$badgeW, [float]$badgeH)
    $g.DrawString("PROJECT-M", $subFont, $textBrush, $subRect, $sf)

    $fullPath = Join-Path $PSScriptRoot "..\public\$filename"
    $bmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $fullPath"
}

GenerateIcon -size 192 -filename "icon-192.png"
GenerateIcon -size 512 -filename "icon-512.png"
