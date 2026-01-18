// server.js - Enhanced backend with new features
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3001;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== IN-MEMORY STORAGE (FALLBACK) =====
let memoryNotes = [
  { 
    id: 1, 
    title: "Welcome Note", 
    content: "Welcome to the Note Taking API!", 
    category: "General",
    tags: ["welcome", "getting-started"],
    isPinned: true,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
let nextId = 2;

// Helper functions for in-memory storage
const findNoteById = (id) => memoryNotes.find(note => note.id === parseInt(id));
const findNoteIndex = (id) => memoryNotes.findIndex(note => note.id === parseInt(id));

// ===== MONGODB SETUP =====
let useMongoDB = false;
let NoteModel;

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/notes_db');
        console.log('✅ Connected to MongoDB');
        
        // Define Note schema
        const noteSchema = new mongoose.Schema({
            title: { 
                type: String, 
                required: [true, 'Title is required'],
                trim: true,
                maxlength: [200, 'Title cannot exceed 200 characters']
            },
            content: { 
                type: String, 
                required: [true, 'Content is required'],
                trim: true
            },
            category: { 
                type: String, 
                default: 'General',
                trim: true
            },
            tags: [{
                type: String,
                trim: true
            }],
            isPinned: { 
                type: Boolean, 
                default: false 
            },
            isArchived: { 
                type: Boolean, 
                default: false 
            }
        }, {
            timestamps: true
        });
        
        // Add indexes for better performance
        noteSchema.index({ title: 'text', content: 'text' });
        noteSchema.index({ isPinned: 1, createdAt: -1 });
        noteSchema.index({ isArchived: 1 });
        noteSchema.index({ category: 1 });
        
        NoteModel = mongoose.model('Note', noteSchema);
        useMongoDB = true;
        
        // Create sample note if collection is empty
        const count = await NoteModel.countDocuments();
        if (count === 0) {
            await NoteModel.create({
                title: 'Welcome to Smart Notes',
                content: 'This is your first note stored in MongoDB! You can create, edit, and organize your notes here.',
                category: 'General',
                tags: ['welcome', 'getting-started'],
                isPinned: true,
                isArchived: false
            });
            console.log('📝 Created sample MongoDB note');
        }
        
    } catch (error) {
        console.log('⚠️  MongoDB not available, using in-memory storage');
        console.log('💡 To use MongoDB, make sure it\'s running on port 27017');
    }
}

// Start MongoDB connection
connectToMongoDB();

// ===== ROUTES =====

// 1. Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: useMongoDB ? "connected" : "in-memory"
    });
});

// 2. Root endpoint - API information
app.get("/", async (req, res) => {
    let totalNotes = memoryNotes.length;
    let dbType = "In-Memory";
    
    if (useMongoDB) {
        totalNotes = await NoteModel.countDocuments();
        dbType = "MongoDB";
    }
    
    res.json({ 
        message: "Smart Notes API", 
        version: "2.0.0",
        status: "Running",
        database: dbType,
        totalNotes: totalNotes,
        endpoints: {
            getAllNotes: "GET /api/notes",
            createNote: "POST /api/notes",
            getNote: "GET /api/notes/:id",
            updateNote: "PUT /api/notes/:id",
            deleteNote: "DELETE /api/notes/:id",
            searchNotes: "GET /api/notes/search/:query",
            getByCategory: "GET /api/notes/category/:category",
            getStats: "GET /api/notes/stats",
            bulkOperations: "POST /api/notes/bulk",
            exportNotes: "GET /api/notes/export/:format",
            importNotes: "POST /api/notes/import",
            pinNote: "PUT /api/notes/:id/pin",
            archiveNote: "PUT /api/notes/:id/archive"
        }
    });
});

// 3. Get all notes with pagination
app.get("/api/notes", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        if (useMongoDB) {
            const notes = await NoteModel.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
                
            const total = await NoteModel.countDocuments();
            
            res.json({
                success: true,
                data: notes,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            });
        } else {
            const startIndex = skip;
            const endIndex = startIndex + limit;
            const notes = memoryNotes
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(startIndex, endIndex);
                
            res.json({
                success: true,
                data: notes,
                pagination: {
                    page,
                    limit,
                    total: memoryNotes.length,
                    pages: Math.ceil(memoryNotes.length / limit),
                    hasNext: page < Math.ceil(memoryNotes.length / limit),
                    hasPrev: page > 1
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch notes"
        });
    }
});

// 4. Get single note by ID
app.get("/api/notes/:id", async (req, res) => {
    try {
        if (useMongoDB) {
            const note = await NoteModel.findById(req.params.id);
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            res.json({
                success: true,
                data: note
            });
        } else {
            const note = findNoteById(req.params.id);
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            res.json({
                success: true,
                data: note
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch note"
        });
    }
});

// Enhanced stats with real-time counting
app.get("/api/notes/enhanced-stats", async (req, res) => {
  try {
      if (useMongoDB) {
          const [
              total,
              pinned,
              archived,
              categories,
              recentNotes,
              tagStats
          ] = await Promise.all([
              NoteModel.countDocuments(),
              NoteModel.countDocuments({ isPinned: true }),
              NoteModel.countDocuments({ isArchived: true }),
              NoteModel.aggregate([
                  { $group: { _id: "$category", count: { $sum: 1 } } },
                  { $sort: { count: -1 } }
              ]),
              NoteModel.find().sort({ createdAt: -1 }).limit(5),
              NoteModel.aggregate([
                  { $unwind: "$tags" },
                  { $group: { _id: "$tags", count: { $sum: 1 } } },
                  { $sort: { count: -1 } },
                  { $limit: 10 }
              ])
          ]);

          res.json({
              success: true,
              data: {
                  total,
                  pinned,
                  archived,
                  categories,
                  recentNotes: recentNotes.length,
                  activeTags: tagStats.length,
                  tagStats,
                  unarchived: total - archived,
                  avgNotesPerCategory: total / Math.max(categories.length, 1),
                  lastUpdated: await NoteModel.findOne().sort({ updatedAt: -1 }).select('updatedAt')
              }
          });
      } else {
          const total = memoryNotes.length;
          const pinned = memoryNotes.filter(n => n.isPinned).length;
          const archived = memoryNotes.filter(n => n.isArchived).length;
          
          const categoryCount = {};
          const tagCount = {};
          
          memoryNotes.forEach(note => {
              const category = note.category || 'General';
              categoryCount[category] = (categoryCount[category] || 0) + 1;
              
              if (note.tags) {
                  note.tags.forEach(tag => {
                      tagCount[tag] = (tagCount[tag] || 0) + 1;
                  });
              }
          });
          
          const categories = Object.entries(categoryCount).map(([name, count]) => ({
              _id: name,
              count
          }));
          
          const tagStats = Object.entries(tagCount).map(([name, count]) => ({
              _id: name,
              count
          })).sort((a, b) => b.count - a.count).slice(0, 10);

          res.json({
              success: true,
              data: {
                  total,
                  pinned,
                  archived,
                  categories,
                  recentNotes: Math.min(memoryNotes.length, 5),
                  activeTags: tagStats.length,
                  tagStats,
                  unarchived: total - archived,
                  avgNotesPerCategory: total / Math.max(categories.length, 1),
                  lastUpdated: memoryNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.updatedAt || null
              }
          });
      }
  } catch (error) {
      res.status(500).json({
          success: false,
          error: "Failed to get enhanced statistics"
      });
  }
});

// 5. Create a new note
app.post("/api/notes", async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        
        // Validation
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: "Title and content are required"
            });
        }
        
        if (useMongoDB) {
            const note = await NoteModel.create({
                title,
                content,
                category: category || "General",
                tags: tags || [],
                isPinned: req.body.isPinned || false,
                isArchived: req.body.isArchived || false
            });
            
            res.status(201).json({
                success: true,
                message: "Note created successfully",
                data: note
            });
        } else {
            const newNote = {
                id: nextId++,
                title,
                content,
                category: category || "General",
                tags: tags || [],
                isPinned: req.body.isPinned || false,
                isArchived: req.body.isArchived || false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            memoryNotes.push(newNote);
            
            res.status(201).json({
                success: true,
                message: "Note created successfully",
                data: newNote
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to create note"
        });
    }
});

// 6. Update a note
app.put("/api/notes/:id", async (req, res) => {
    try {
        if (useMongoDB) {
            const note = await NoteModel.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            res.json({
                success: true,
                message: "Note updated successfully",
                data: note
            });
        } else {
            const index = findNoteIndex(req.params.id);
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            const updatedNote = {
                ...memoryNotes[index],
                ...req.body,
                updatedAt: new Date()
            };
            
            memoryNotes[index] = updatedNote;
            
            res.json({
                success: true,
                message: "Note updated successfully",
                data: updatedNote
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to update note"
        });
    }
});

// 7. Delete a note
app.delete("/api/notes/:id", async (req, res) => {
    try {
        if (useMongoDB) {
            const note = await NoteModel.findByIdAndDelete(req.params.id);
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            res.json({
                success: true,
                message: "Note deleted successfully",
                data: note
            });
        } else {
            const index = findNoteIndex(req.params.id);
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            const deletedNote = memoryNotes.splice(index, 1)[0];
            
            res.json({
                success: true,
                message: "Note deleted successfully",
                data: deletedNote
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to delete note"
        });
    }
});

// 8. Search notes
app.get("/api/notes/search/:query", async (req, res) => {
    try {
        const searchQuery = req.params.query;
        
        if (useMongoDB) {
            const notes = await NoteModel.find({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { content: { $regex: searchQuery, $options: 'i' } },
                    { tags: { $regex: searchQuery, $options: 'i' } }
                ]
            });
            
            res.json({
                success: true,
                count: notes.length,
                query: searchQuery,
                data: notes
            });
        } else {
            const foundNotes = memoryNotes.filter(note => 
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (note.tags && note.tags.some(tag => 
                    tag.toLowerCase().includes(searchQuery.toLowerCase())
                ))
            );
            
            res.json({
                success: true,
                count: foundNotes.length,
                query: searchQuery,
                data: foundNotes
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to search notes"
        });
    }
});

// 9. Get notes by category
app.get("/api/notes/category/:category", async (req, res) => {
    try {
        const category = req.params.category;
        
        if (useMongoDB) {
            const notes = await NoteModel.find({ 
                category: { $regex: category, $options: 'i' } 
            });
            
            res.json({
                success: true,
                count: notes.length,
                category: category,
                data: notes
            });
        } else {
            const categoryNotes = memoryNotes.filter(note => 
                note.category.toLowerCase() === category.toLowerCase()
            );
            
            res.json({
                success: true,
                count: categoryNotes.length,
                category: category,
                data: categoryNotes
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch notes by category"
        });
    }
});

// 10. Pin/Unpin a note
app.put("/api/notes/:id/pin", async (req, res) => {
    try {
        if (useMongoDB) {
            const note = await NoteModel.findById(req.params.id);
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            note.isPinned = !note.isPinned;
            await note.save();
            
            res.json({
                success: true,
                message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
                data: note
            });
        } else {
            const index = findNoteIndex(req.params.id);
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            memoryNotes[index].isPinned = !memoryNotes[index].isPinned;
            memoryNotes[index].updatedAt = new Date();
            
            const action = memoryNotes[index].isPinned ? 'pinned' : 'unpinned';
            
            res.json({
                success: true,
                message: `Note ${action} successfully`,
                data: memoryNotes[index]
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to pin/unpin note"
        });
    }
});

// 11. Archive/Unarchive a note
app.put("/api/notes/:id/archive", async (req, res) => {
    try {
        const archiveStatus = req.body.archive !== undefined ? req.body.archive : true;
        
        if (useMongoDB) {
            const note = await NoteModel.findByIdAndUpdate(
                req.params.id,
                { isArchived: archiveStatus, updatedAt: new Date() },
                { new: true }
            );
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            const action = archiveStatus ? 'archived' : 'unarchived';
            
            res.json({
                success: true,
                message: `Note ${action} successfully`,
                data: note
            });
        } else {
            const index = findNoteIndex(req.params.id);
            
            if (index === -1) {
                return res.status(404).json({
                    success: false,
                    error: "Note not found"
                });
            }
            
            memoryNotes[index].isArchived = archiveStatus;
            memoryNotes[index].updatedAt = new Date();
            
            const action = archiveStatus ? 'archived' : 'unarchived';
            
            res.json({
                success: true,
                message: `Note ${action} successfully`,
                data: memoryNotes[index]
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to archive/unarchive note"
        });
    }
});

// 12. Get statistics endpoint
app.get("/api/notes/stats", async (req, res) => {
    try {
        if (useMongoDB) {
            const total = await NoteModel.countDocuments();
            const pinned = await NoteModel.countDocuments({ isPinned: true });
            const archived = await NoteModel.countDocuments({ isArchived: true });
            const categories = await NoteModel.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            res.json({
                success: true,
                data: {
                    total,
                    pinned,
                    archived,
                    categories
                }
            });
        } else {
            const total = memoryNotes.length;
            const pinned = memoryNotes.filter(n => n.isPinned).length;
            const archived = memoryNotes.filter(n => n.isArchived).length;
            
            // Count notes by category
            const categoryCount = {};
            memoryNotes.forEach(note => {
                const category = note.category || 'General';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            
            const categories = Object.entries(categoryCount).map(([name, count]) => ({
                _id: name,
                count
            }));

            res.json({
                success: true,
                data: {
                    total,
                    pinned,
                    archived,
                    categories
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get statistics"
        });
    }
});

// 13. Bulk operations
app.post("/api/notes/bulk", async (req, res) => {
    try {
        const { action, noteIds } = req.body;
        
        if (!action || !noteIds || !Array.isArray(noteIds)) {
            return res.status(400).json({
                success: false,
                error: "Action and noteIds array are required"
            });
        }

        let result;
        if (useMongoDB) {
            switch (action) {
                case 'archive':
                    result = await NoteModel.updateMany(
                        { _id: { $in: noteIds } },
                        { $set: { isArchived: true, updatedAt: new Date() } }
                    );
                    break;
                case 'unarchive':
                    result = await NoteModel.updateMany(
                        { _id: { $in: noteIds } },
                        { $set: { isArchived: false, updatedAt: new Date() } }
                    );
                    break;
                case 'delete':
                    result = await NoteModel.deleteMany({ _id: { $in: noteIds } });
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: "Invalid action"
                    });
            }
        } else {
            switch (action) {
                case 'archive':
                    noteIds.forEach(id => {
                        const index = memoryNotes.findIndex(n => n.id == id);
                        if (index !== -1) {
                            memoryNotes[index].isArchived = true;
                            memoryNotes[index].updatedAt = new Date();
                        }
                    });
                    result = { modifiedCount: noteIds.length };
                    break;
                case 'unarchive':
                    noteIds.forEach(id => {
                        const index = memoryNotes.findIndex(n => n.id == id);
                        if (index !== -1) {
                            memoryNotes[index].isArchived = false;
                            memoryNotes[index].updatedAt = new Date();
                        }
                    });
                    result = { modifiedCount: noteIds.length };
                    break;
                case 'delete':
                    memoryNotes = memoryNotes.filter(note => !noteIds.includes(note.id.toString()));
                    result = { deletedCount: noteIds.length };
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: "Invalid action"
                    });
            }
        }

        res.json({
            success: true,
            message: `Bulk ${action} completed`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to perform bulk operation"
        });
    }
});

// 14. Export notes endpoint
app.get("/api/notes/export/:format", async (req, res) => {
    try {
        const format = req.params.format;
        
        if (useMongoDB) {
            const notes = await NoteModel.find();
            
            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename=notes.json');
                res.send(JSON.stringify(notes, null, 2));
            } else if (format === 'csv') {
                // Convert to CSV
                const csv = notes.map(note => 
                    `"${note.title}","${note.content.replace(/"/g, '""')}","${note.category}","${note.tags ? note.tags.join(',') : ''}","${note.createdAt}"`
                ).join('\n');
                
                const csvContent = 'Title,Content,Category,Tags,Created At\n' + csv;
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=notes.csv');
                res.send(csvContent);
            } else {
                res.status(400).json({
                    success: false,
                    error: "Unsupported format. Use 'json' or 'csv'"
                });
            }
        } else {
            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename=notes.json');
                res.send(JSON.stringify(memoryNotes, null, 2));
            } else {
                res.status(400).json({
                    success: false,
                    error: "Only JSON export supported for in-memory storage"
                });
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to export notes"
        });
    }
});

// 15. Import notes endpoint
app.post("/api/notes/import", async (req, res) => {
    try {
        const { notes } = req.body;
        
        if (!Array.isArray(notes)) {
            return res.status(400).json({
                success: false,
                error: "Notes array is required"
            });
        }

        let importedCount = 0;
        
        if (useMongoDB) {
            const validNotes = notes.filter(note => note.title && note.content);
            if (validNotes.length > 0) {
                await NoteModel.insertMany(validNotes);
                importedCount = validNotes.length;
            }
        } else {
            notes.forEach(note => {
                if (note.title && note.content) {
                    const newNote = {
                        id: nextId++,
                        ...note,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    memoryNotes.push(newNote);
                    importedCount++;
                }
            });
        }

        res.json({
            success: true,
            message: `Imported ${importedCount} notes`,
            data: { importedCount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to import notes"
        });
    }
});

// 16. Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// 17. 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log("🚀 Smart Notes Server v2.0");
    console.log("✅ Server running on http://localhost:" + PORT);
    console.log("📊 Database: " + (useMongoDB ? "MongoDB" : "In-Memory"));
    console.log("📡 Health check: http://localhost:" + PORT + "/health");
    console.log("📚 API Docs: http://localhost:" + PORT);
    console.log("\n📋 Enhanced Features:");
    console.log("   • Pagination support");
    console.log("   • Bulk operations");
    console.log("   • Export/Import functionality");
    console.log("   • Statistics dashboard");
    console.log("   • Advanced search");
    console.log("   • Category filtering");
    console.log("\nPress Ctrl+C to stop the server");
});