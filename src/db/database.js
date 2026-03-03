const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration INTEGER,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    has_embedded_cover BOOLEAN DEFAULT FALSE,
    cover_format TEXT,
    independent_cover_path TEXT,
    lyrics_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT,
    cover_path TEXT,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lyrics_cache (
    song_id TEXT PRIMARY KEY,
    lyrics TEXT,
    format TEXT DEFAULT 'lrc',
    FOREIGN KEY (song_id) REFERENCES songs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
  CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
  CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);
`);

module.exports = db;
