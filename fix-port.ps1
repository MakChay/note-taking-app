# fix-port.ps1
Write-Host "=== Fixing Port Issue ===" -ForegroundColor Cyan

# Kill any processes using port 5000
Write-Host "Checking for processes on port 5000..." -ForegroundColor Yellow
$processes = netstat -ano | findstr :5000
if ($processes) {
    Write-Host "Found processes using port 5000:" -ForegroundColor Red
    $processes
    $pids = $processes | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
    foreach ($pid in $pids) {
        Write-Host "Killing process PID: $pid" -ForegroundColor Yellow
        taskkill /PID $pid /F 2>$null
    }
}

# Also kill Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Update server.js to use port 3000
Write-Host "Updating server to use port 3000..." -ForegroundColor Yellow
$serverContent = @'
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ 
    message: "Note Taking API", 
    version: "1.0.0",
    status: "Running",
    time: new Date().toISOString()
  });
});

let notes = [];

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

$serverContent | Set-Content server.js -Force

Write-Host "`n✅ Fix complete! Run: node server.js" -ForegroundColor Green