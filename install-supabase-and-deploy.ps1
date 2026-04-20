# PowerShell Script to Install Supabase CLI and Deploy Edge Functions
# Run this script in PowerShell as Administrator

Write-Host "🚀 DataLens Edge Functions Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Scoop is installed
$scoopInstalled = $null -ne (Get-Command scoop -ErrorAction SilentlyContinue)

if (-not $scoopInstalled) {
    Write-Host "📦 Installing Scoop package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
}

# Install Supabase CLI using Scoop
Write-Host "📦 Installing Supabase CLI..." -ForegroundColor Yellow
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verify installation
Write-Host ""
Write-Host "✅ Supabase CLI installed!" -ForegroundColor Green
supabase --version

# Link to project
Write-Host ""
Write-Host "🔗 Linking to Supabase project..." -ForegroundColor Yellow
$projectRef = "aqyacoxrjaeizgwvzcov"
supabase link --project-ref $projectRef

# Deploy functions
Write-Host ""
Write-Host "🚀 Deploying Edge Functions..." -ForegroundColor Yellow

$functions = @(
    "upload-file",
    "create-job",
    "get-job-status",
    "get-analysis-results",
    "ai-insights"
)

foreach ($func in $functions) {
    Write-Host ""
    Write-Host "📦 Deploying: $func" -ForegroundColor Cyan

    if (Test-Path "supabase\functions\$func\index.ts") {
        supabase functions deploy $func --no-verify-jwt

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployed: $func" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy: $func" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  File not found: supabase\functions\$func\index.ts" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Set GEMINI_API_KEY in Supabase Dashboard -> Edge Functions -> Settings" -ForegroundColor White
Write-Host "  2. Create storage bucket data-uploads in Supabase Dashboard -> Storage" -ForegroundColor White
Write-Host "  3. Test file upload at: https://data-lens-five.vercel.app" -ForegroundColor White
Write-Host ""
