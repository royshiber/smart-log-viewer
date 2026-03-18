# Smart Log Viewer - Push to GitHub
# Run this after: gh auth login

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

# Refresh PATH for gh
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location $projectRoot

# Rename branch to main
git branch -M main 2>$null

# Check if logged in
$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "GitHub CLI: You need to log in first." -ForegroundColor Yellow
    Write-Host "Run: gh auth login" -ForegroundColor Cyan
    Write-Host "Then run this script again." -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Create repo and push
Write-Host "Creating GitHub repository and pushing..." -ForegroundColor Cyan
gh repo create smart-log-viewer --public --source=. --remote=origin --push --description "Smart ArduPilot BIN log viewer with natural language and Gemini chat"

if ($LASTEXITCODE -eq 0) {
    $repo = gh repo view --json url -q .url
    Write-Host ""
    Write-Host "Done! Repository: $repo" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "If repo already exists, run:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/smart-log-viewer.git" -ForegroundColor Gray
    Write-Host "  git push -u origin main" -ForegroundColor Gray
}
