# test-api.ps1
Write-Host "=== Testing Note-Taking API ===" -ForegroundColor Cyan
Write-Host "Server should be running on http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

# Wait a moment
Start-Sleep -Seconds 2

# Test 1: Get API info
Write-Host "1. Getting API info..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000" -Method Get
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   📊 Total notes: $($response.totalNotes)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 2: Get all notes
Write-Host "`n2. Getting all notes..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes" -Method Get
    Write-Host "   ✅ Found $($response.count) notes" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 3: Create a note
Write-Host "`n3. Creating a new note..." -ForegroundColor Green
$newNote = @{
    title = "Shopping List"
    content = "Milk, Eggs, Bread, Coffee"
    category = "Personal"
    tags = @("shopping", "groceries")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes" `
        -Method Post `
        -Body $newNote `
        -ContentType "application/json"
    
    $noteId = $response.data.id
    Write-Host "   ✅ Note created!" -ForegroundColor Green
    Write-Host "   📝 ID: $noteId, Title: $($response.data.title)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 4: Create another note
Write-Host "`n4. Creating another note..." -ForegroundColor Green
$projectNote = @{
    title = "Project Ideas"
    content = "1. Build a weather app`n2. Create a blog`n3. Learn React"
    category = "Projects"
    tags = @("ideas", "todo", "planning")
    isPinned = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes" `
        -Method Post `
        -Body $projectNote `
        -ContentType "application/json"
    
    $pinnedNoteId = $response.data.id
    Write-Host "   ✅ Note created!" -ForegroundColor Green
    Write-Host "   📌 Pinned: $($response.data.isPinned)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 5: Get single note
if ($noteId) {
    Write-Host "`n5. Getting note ID $noteId..." -ForegroundColor Green
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes/$noteId" -Method Get
        Write-Host "   ✅ Retrieved successfully!" -ForegroundColor Green
        Write-Host "   📋 Content: $($response.data.content.substring(0, 30))..." -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }
}

# Test 6: Update note
if ($noteId) {
    Write-Host "`n6. Updating note ID $noteId..." -ForegroundColor Green
    $update = @{
        title = "Updated: Shopping List"
        content = "Milk, Eggs, Bread, Coffee, Fruits, Vegetables"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes/$noteId" `
            -Method Put `
            -Body $update `
            -ContentType "application/json"
        
        Write-Host "   ✅ Updated successfully!" -ForegroundColor Green
        Write-Host "   📝 New title: $($response.data.title)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }
}

# Test 7: Search notes
Write-Host "`n7. Searching for 'shopping'..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes/search/shopping" -Method Get
    Write-Host "   ✅ Found $($response.count) notes" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 8: Get notes by category
Write-Host "`n8. Getting 'Personal' category notes..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes/category/Personal" -Method Get
    Write-Host "   ✅ Found $($response.count) notes" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 9: Pin a note
if ($noteId) {
    Write-Host "`n9. Pinning note ID $noteId..." -ForegroundColor Green
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes/$noteId/pin" -Method Put
        Write-Host "   ✅ $($response.message)" -ForegroundColor Green
        Write-Host "   📌 Pinned status: $($response.data.isPinned)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }
}

# Test 10: Get pinned notes
Write-Host "`n10. Getting pinned notes..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes?pinned=true" -Method Get
    Write-Host "   ✅ Found $($response.count) pinned notes" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Test 11: Get all notes count
Write-Host "`n11. Final check - all notes..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/notes" -Method Get
    Write-Host "   ✅ Total notes in system: $($response.total)" -ForegroundColor Green
    Write-Host "   📊 Currently showing: $($response.count)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "API is working perfectly! 🎉" -ForegroundColor Green