const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

// Notes array (in-memory)
let notes = [
  { id: 1, title: "First Note", content: "This is my first note" },
  { id: 2, title: "Second Note", content: "This is another note" }
];

// Get all notes
app.get("/api/notes", (req, res) => {
  res.json({
    success: true,
    count: notes.length,
    data: notes
  });
});

// Create a note
app.post("/api/notes", (req, res) => {
  const newNote = {
    id: notes.length + 1,
    title: req.body.title || "Untitled",
    content: req.body.content || "",
    createdAt: new Date()
  };
  notes.push(newNote);
  res.status(201).json({
    success: true,
    data: newNote
  });
});


