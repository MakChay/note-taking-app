# test-simple.ps1
Write-Host "=== Testing Note-Taking API ===" -ForegroundColor Cyan
Write-Host ""

# Wait for server to start
Start-Sleep -Seconds 3

# Test 1: Get API info
Write-Host "1. Testing API root..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get all notes
Write-Host "`n2. Getting all notes..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/notes" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Success! Found $($response.count) notes" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create a note
Write-Host "`n3. Creating a note..." -ForegroundColor Green
$body = @{
    title = "Test Note"
    content = "This is a test note created via PowerShell"
    category = "Testing"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/notes" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "   ✅ Note created!" -ForegroundColor Green
    Write-Host "   ID: $($response.data.id)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan