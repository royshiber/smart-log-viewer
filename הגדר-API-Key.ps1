# סקריפט הגדרת Gemini API Key
# הרץ: לחיצה ימנית על הקובץ -> Run with PowerShell

$projectRoot = $PSScriptRoot
$envPath = Join-Path $projectRoot "server\.env"

Write-Host ""
Write-Host "=== הגדרת Gemini API Key ===" -ForegroundColor Cyan
Write-Host ""

# פתיחת הדפדפן לקבלת המפתח
Write-Host "1. פותח את הדפדפן..." -ForegroundColor Yellow
Start-Process "https://aistudio.google.com/apikey"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "2. בדפדפן שנפתח:" -ForegroundColor Yellow
Write-Host "   - התחבר עם חשבון Google"
Write-Host "   - לחץ על 'Create API Key'"
Write-Host "   - העתק את המפתח (Ctrl+C)"
Write-Host ""

# יצירת .env אם לא קיים
if (-not (Test-Path $envPath)) {
    Set-Content -Path $envPath -Value "GEMINI_API_KEY=" -Encoding UTF8
    Write-Host "3. נוצר קובץ server\.env" -ForegroundColor Green
} else {
    Write-Host "3. קובץ server\.env כבר קיים" -ForegroundColor Gray
    Write-Host "   אם יש 'your_key_here' - החלף במפתח האמיתי" -ForegroundColor Gray
}

Write-Host ""
Write-Host "4. הדבק את המפתח שלך בקובץ:" -ForegroundColor Yellow
Write-Host "   $envPath" -ForegroundColor White
Write-Host ""
Write-Host "   הפורמט: GEMINI_API_KEY=המפתח_שלך" -ForegroundColor Gray
Write-Host ""

# פתיחת הקובץ בעורך
$editor = $env:EDITOR
if ($env:CURSOR) {
    Start-Process "cursor" -ArgumentList $envPath -ErrorAction SilentlyContinue
} elseif (Get-Command code -ErrorAction SilentlyContinue) {
    Start-Process "code" -ArgumentList $envPath -ErrorAction SilentlyContinue
} else {
    Start-Process notepad -ArgumentList $envPath
}

Write-Host "5. הקובץ נפתח. הדבק את המפתח אחרי = ושמור (Ctrl+S)" -ForegroundColor Green
Write-Host ""
Write-Host "6. הפעל מחדש את השרת: npm run dev" -ForegroundColor Cyan
Write-Host ""
