# ============================================
#  Portfolio Auto-Deploy Script
#  Usage: .\deploy.ps1
#  ضع الملفات الجديدة في فولدر "updates" جنب السكربت
# ============================================

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\mhsaa\Desktop\portfolio"
$UpdatesDir  = Join-Path $ProjectRoot "updates"

Write-Host ""
Write-Host "Portfolio Auto-Deploy" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

Set-Location $ProjectRoot

# ── الخطوة 1: سحب آخر تغييرات من GitHub ──
Write-Host ""
Write-Host "[1/6] Pulling latest changes from GitHub..." -ForegroundColor Yellow
git pull origin main --no-rebase --no-edit
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git pull had conflicts! Resolving with local versions..." -ForegroundColor Red
    git checkout --ours .
    git add .
    git commit -m "Merge: keep local versions" --no-edit
}

# ── الخطوة 2: توزيع الملفات من فولدر updates ──
Write-Host ""
Write-Host "[2/6] Distributing updated files..." -ForegroundColor Yellow

# خريطة: اسم الملف → وجهته في المشروع
$FileMap = @{
    "portfolio.json"      = "data\portfolio.json"
    "globals.css"         = "src\app\globals.css"
    "layout.tsx"          = "src\app\layout.tsx"
    "page.tsx"            = "src\app\page.tsx"
    "admin-page.tsx"      = "src\app\admin\page.tsx"
    "route.ts"            = "src\app\api\update\route.ts"
    "upload-route.ts"     = "src\app\api\upload\route.ts"
    "PortfolioClient.tsx" = "src\components\PortfolioClient.tsx"
    "AdminDashboard.tsx"  = "src\components\AdminDashboard.tsx"
}

if (Test-Path $UpdatesDir) {
    $copied = 0
    Get-ChildItem $UpdatesDir -File | ForEach-Object {
        $name = $_.Name
        if ($FileMap.ContainsKey($name)) {
            $dest = Join-Path $ProjectRoot $FileMap[$name]
            $destDir = Split-Path $dest -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                Write-Host "  Created folder: $destDir" -ForegroundColor DarkGray
            }
            Copy-Item $_.FullName $dest -Force
            Write-Host "  OK $name -> $($FileMap[$name])" -ForegroundColor Green
            $copied++
        } else {
            Write-Host "  SKIP $name (unknown file, skipped)" -ForegroundColor DarkYellow
        }
    }
    if ($copied -eq 0) {
        Write-Host "  No known files found in updates folder" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  No 'updates' folder found - skipping file copy" -ForegroundColor DarkGray
    New-Item -ItemType Directory -Path $UpdatesDir -Force | Out-Null
    Write-Host "  Created empty 'updates' folder for next time" -ForegroundColor DarkGray
}

# ── الخطوة 3: التحقق من وجود تغييرات ──
Write-Host ""
Write-Host "[3/6] Checking for changes..." -ForegroundColor Yellow
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "  No changes detected. Nothing to deploy." -ForegroundColor DarkGray
    exit 0
}
Write-Host "  Changes found:" -ForegroundColor Green
git status --short

# ── الخطوة 4: بناء المشروع للتأكد من عدم وجود أخطاء ──
Write-Host ""
Write-Host "[4/6] Building project (this takes ~30s)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD FAILED! Fix the errors above before deploying." -ForegroundColor Red
    Write-Host "Your files were copied but NOT pushed to GitHub." -ForegroundColor Red
    exit 1
}
Write-Host "  Build successful!" -ForegroundColor Green

# ── الخطوة 5: رفع التغييرات ──
Write-Host ""
Write-Host "[5/6] Committing and pushing to GitHub..." -ForegroundColor Yellow
git add .
$commitMsg = Read-Host "  Commit message (Enter = 'Update portfolio')"
if (-not $commitMsg) { $commitMsg = "Update portfolio" }
git commit -m $commitMsg
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Push rejected - pulling and retrying..." -ForegroundColor DarkYellow
    git pull origin main --no-rebase --no-edit
    git push origin main
}

# ── الخطوة 6: تنظيف فولدر updates ──
Write-Host ""
Write-Host "[6/6] Cleaning updates folder..." -ForegroundColor Yellow
Get-ChildItem $UpdatesDir -File | Remove-Item -Force
Write-Host "  Cleaned!" -ForegroundColor Green

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  DEPLOYED! Vercel will update in ~2 minutes" -ForegroundColor Green
Write-Host "  Site:  https://portfolio-mauve-one-46.vercel.app" -ForegroundColor Cyan
Write-Host "  Admin: https://portfolio-mauve-one-46.vercel.app/admin" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
