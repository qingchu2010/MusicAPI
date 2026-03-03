const db = require('../db/database');
const { generateId } = require('../utils/idGenerator');
const { scanMusicDirectory, findIndependentCover, findLyricsFile } = require('../utils/fileScanner');
const { extractMetadata } = require('./metadataService');
const config = require('../config');

async function scanAndIndex() {
  const files = scanMusicDirectory(config.musicDir);
  const results = { added: 0, updated: 0, errors: 0 };
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO songs 
    (id, title, artist, album, duration, file_path, file_size, has_embedded_cover, cover_format, independent_cover_path, lyrics_path, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  
  for (const file of files) {
    try {
      const metadata = await extractMetadata(file.path);
      const independentCover = findIndependentCover(file.dir);
      const lyricsPath = findLyricsFile(file.path);
      
      const existingSong = db.prepare('SELECT id FROM songs WHERE file_path = ?').get(file.path);
      const id = existingSong ? existingSong.id : generateId();
      
      insertStmt.run(
        id,
        metadata.title,
        metadata.artist,
        metadata.album,
        metadata.duration,
        file.path,
        file.size,
        metadata.hasEmbeddedCover ? 1 : 0,
        metadata.coverFormat,
        independentCover,
        lyricsPath
      );
      
      if (existingSong) {
        results.updated++;
      } else {
        results.added++;
      }
    } catch (error) {
      results.errors++;
    }
  }
  
  return results;
}

function getSongs(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const songs = db.prepare(`
    SELECT id, title, artist FROM songs 
    ORDER BY title ASC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM songs').get().count;
  
  return {
    songs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

function getSongById(id) {
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);
  if (!song) return null;
  
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    hasEmbeddedCover: !!song.has_embedded_cover,
    urls: {
      audio: `/api/songs/${song.id}/audio`,
      cover: `/api/songs/${song.id}/cover`,
      lyrics: `/api/songs/${song.id}/lyrics`
    }
  };
}

function getSongFilePath(id) {
  const song = db.prepare('SELECT file_path FROM songs WHERE id = ?').get(id);
  return song ? song.file_path : null;
}

function getSongCoverInfo(id) {
  const song = db.prepare('SELECT independent_cover_path, has_embedded_cover, cover_format, file_path FROM songs WHERE id = ?').get(id);
  return song || null;
}

function getSongLyricsPath(id) {
  const song = db.prepare('SELECT lyrics_path FROM songs WHERE id = ?').get(id);
  return song ? song.lyrics_path : null;
}

function searchSongs(query, type = 'song') {
  const searchPattern = `%${query}%`;
  
  if (type === 'album') {
    return db.prepare(`
      SELECT DISTINCT album, artist FROM songs 
      WHERE album LIKE ? 
      ORDER BY album ASC
    `).all(searchPattern);
  }
  
  if (type === 'artist') {
    return db.prepare(`
      SELECT DISTINCT artist FROM songs 
      WHERE artist LIKE ? 
      ORDER BY artist ASC
    `).all(searchPattern);
  }
  
  return db.prepare(`
    SELECT id, title, artist, album FROM songs 
    WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
    ORDER BY title ASC
    LIMIT 50
  `).all(searchPattern, searchPattern, searchPattern);
}

module.exports = {
  scanAndIndex,
  getSongs,
  getSongById,
  getSongFilePath,
  getSongCoverInfo,
  getSongLyricsPath,
  searchSongs
};
