# Smart Log Viewer - Git Setup Script
# Run: .\setup-git.ps1

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

Write-Host "Smart Log Viewer - Git Setup" -ForegroundColor Cyan
Write-Host ""

# Check Git
try {
    git --version | Out-Null
} catch {
    Write-Host "ERROR: Git is not installed. Download from https://git-scm.com/downloads" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

# Init if needed
if (-not (Test-Path .git)) {
    git init
    Write-Host "Git initialized." -ForegroundColor Green
} else {
    Write-Host "Git already initialized." -ForegroundColor Yellow
}

# Add all
git add .
Write-Host "Files staged." -ForegroundColor Green

# Status
Write-Host ""
Write-Host "Files to commit:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. git commit -m `"Initial commit: Smart Log Viewer`""
Write-Host "2. Create a new repo on GitHub (github.com/new)"
Write-Host "3. git remote add origin https://github.com/YOUR_USERNAME/smart-log-viewer.git"
Write-Host "4. git branch -M main"
Write-Host "5. git push -u origin main"
Write-Host ""
Write-Host "See GITHUB_SETUP.md for full instructions." -ForegroundColor Gray
