Add-Type -AssemblyName System.Drawing

# Create sample PNG (300x200)
$bmp = New-Object System.Drawing.Bitmap 300, 200
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::LightSkyBlue)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Navy)
$font = New-Object System.Drawing.Font ("Arial", 16, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Sample PNG Image", $font, $brush, 20, 80)
$g.Dispose()
$bmp.Save("D:\Konverter\poc-converters\fixtures\sample.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "PNG created"

# Create sample JPG (400x300)
$bmp2 = New-Object System.Drawing.Bitmap 400, 300
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.Clear([System.Drawing.Color]::DarkSeaGreen)
$brush2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::DarkOliveGreen)
$font2 = New-Object System.Drawing.Font ("Arial", 20, [System.Drawing.FontStyle]::Bold)
$g2.DrawString("Sample JPG Image", $font2, $brush2, 30, 120)
$g2.Dispose()
$bmp2.Save("D:\Konverter\poc-converters\fixtures\sample.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp2.Dispose()
Write-Host "JPG created"

