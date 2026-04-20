# Edge Function Diagnostic Script
# Run this to check if Edge Functions are working

$SUPABASE_URL = "https://aqyacoxrjaeizgwvzcov.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTMzOTMsImV4cCI6MjA5MjA4OTM5M30.TR_Fl0FiLdVGdCFdW-Ph2SWw3ubEftxSZ25w2Uicvs4"

Write-Host "🔍 Edge Functions Diagnostics" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Test 1: upload-file
Write-Host "Testing upload-file..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/upload-file" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "multipart/form-data"
        } `
        -Body @{
            file = [System.IO.File]::ReadAllBytes("test.csv")
            user_id = "test"
        } `
        -ErrorAction Stop

    Write-Host "✅ upload-file: Working!" -ForegroundColor Green
    Write-Host "Response: $response"
} catch {
    Write-Host "❌ upload-file: Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""

# Test 2: create-job
Write-Host "Testing create-job..." -ForegroundColor Yellow
try {
    $body = @{
        file_name = "test.csv"
        file_size = 1000
        file_path = "test/test.csv"
        user_id = "test"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/create-job" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ create-job: Working!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ create-job: Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Common Issues:" -ForegroundColor Cyan
Write-Host "  1. Storage bucket 'data-uploads' doesn't exist" -ForegroundColor White
Write-Host "  2. Environment variables not set" -ForegroundColor White
Write-Host "  3. Service role key permissions" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To fix:" -ForegroundColor Cyan
Write-Host "  1. Go to Supabase Dashboard → Storage" -ForegroundColor White
Write-Host "  2. Create bucket named 'data-uploads'" -ForegroundColor White
Write-Host "  3. Make it public" -ForegroundColor White
Write-Host "  4. Check Edge Function logs for specific errors" -ForegroundColor White
