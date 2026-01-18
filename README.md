# Note Taking App

A simple RESTful API for note management.

## Features
- Create, read, update, delete notes
- In-memory storage (can be extended to MongoDB)
- RESTful API design

## Installation
1. Clone the repository
2. Run `npm install`
3. Run `node server.js`
4. Access API at `http://localhost:3001`

## API Endpoints
- GET `/` - API information
- GET `/api/notes` - Get all notes
- POST `/api/notes` - Create a note
- etc...