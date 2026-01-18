# fix-all.ps1
Write-Host "=== Fixing Everything ===" -ForegroundColor Cyan

# 1. Kill all Node processes
Write-Host "Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Create clean server.js with port 3001
Write-Host "Creating clean server.js..." -ForegroundColor Yellow
$serverJs = @'
const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());

let notes = [];

app.get("/", (req, res) => {
  res.json({ 
    message: "Note Taking API", 
    version: "1.0.0",
    status: "Running",
    totalNotes: notes.length
  });
});

app.get("/api/notes", (req, res) => {
  res.json({
    success: true,
    count: notes.length,
    data: notes
  });
});

app.post("/api/notes", (req, res) => {
  const note = {
    id: notes.length + 1,
    title: req.body.title || "Untitled",
    content: req.body.content || "",
    createdAt: new Date()
  };
  notes.push(note);
  res.status(201).json({
    success: true,
    data: note
  });
});

app.listen(PORT, () => {
  console.log("✅ Server running on http://localhost:" + PORT);
});
'@

$serverJs | Set-Content server.js -Force

# 3. Update package.json
Write-Host "Updating package.json..." -ForegroundColor Yellow
$packageJson = @'
{
  "name": "note-taking-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "4.18.2"
  }
}
'@

$packageJson | Set-Content package.json -Force

# 4. Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install express

Write-Host "`n✅ All fixes applied!" -ForegroundColor Green
Write-Host "Run: node server.js" -ForegroundColor Cyan