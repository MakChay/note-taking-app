# fix-cors.ps1
Write-Host "=== Fixing CORS Issue ===" -ForegroundColor Cyan

# 1. Install CORS
Write-Host "Installing CORS package..." -ForegroundColor Yellow
npm install cors

# 2. Update server.js port to 3001
Write-Host "Updating server to port 3001..." -ForegroundColor Yellow
$serverContent = Get-Content server.js -Raw
$serverContent = $serverContent -replace 'const PORT = 3002;', 'const PORT = 3001;'

# Add CORS import and middleware
if (-not ($serverContent -match 'require.*cors')) {
    $serverContent = $serverContent -replace 'const express = require\("express"\);', 
        'const express = require("express");' + "`n" + 'const cors = require("cors");'
    
    $serverContent = $serverContent -replace 'app\.use\(express\.json\(\)\);', 
        'app.use(cors());' + "`n" + 'app.use(express.json());'
}

$serverContent | Set-Content server.js -Force

# 3. Create public folder with index.html
Write-Host "Creating frontend..." -ForegroundColor Yellow
mkdir public -Force

$htmlContent = @'
<!DOCTYPE html>
<html>
<head>
    <title>Note Taking App</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
        .note { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .note.pinned { background-color: #fff9c4; border-color: #ffd54f; }
        input, textarea { width: 100%; padding: 8px; margin: 5px 0; }
        button { padding: 10px 15px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>📝 Note Taking App</h1>
    
    <div>
        <h3>Create New Note</h3>
        <input type="text" id="title" placeholder="Title">
        <textarea id="content" placeholder="Content" rows="4"></textarea>
        <input type="text" id="category" placeholder="Category (optional)">
        <button onclick="createNote()">Create Note</button>
    </div>
    
    <h3>Your Notes</h3>
    <div id="notes"></div>
    
    <script>
        const API_URL = '/api/notes';
        
        async function loadNotes() {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                displayNotes(data.data);
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('notes').innerHTML = '<p>Loading notes...</p>';
            }
        }
        
        function displayNotes(notes) {
            const container = document.getElementById('notes');
            container.innerHTML = '';
            
            notes.forEach(note => {
                const div = document.createElement('div');
                div.className = \`note \${note.isPinned ? 'pinned' : ''}\`;
                div.innerHTML = \`
                    <h4>\${note.title} \${note.isPinned ? '📌' : ''}</h4>
                    <p>\${note.content}</p>
                    <small>Category: \${note.category}</small>
                    <div>
                        <button onclick="deleteNote('\${note._id || note.id}')">Delete</button>
                    </div>
                \`;
                container.appendChild(div);
            });
        }
        
        async function createNote() {
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            const category = document.getElementById('category').value;
            
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, category: category || 'General' })
            });
            
            document.getElementById('title').value = '';
            document.getElementById('content').value = '';
            document.getElementById('category').value = '';
            loadNotes();
        }
        
        async function deleteNote(id) {
            if (confirm('Delete this note?')) {
                await fetch(\`\${API_URL}/\${id}\`, { method: 'DELETE' });
                loadNotes();
            }
        }
        
        loadNotes();
    </script>
</body>
</html>
'@

$htmlContent | Set-Content public/index.html -Force

Write-Host "`n✅ CORS fixed!" -ForegroundColor Green
Write-Host "Run: node server.js" -ForegroundColor Cyan
Write-Host "Visit: http://localhost:3001" -ForegroundColor Cyan