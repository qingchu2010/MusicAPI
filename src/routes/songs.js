const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');
const coverService = require('../services/coverService');
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  
  const result = musicService.getSongs(page, limit);
  res.json(result);
});

router.get('/:id', (req, res) => {
  const song = musicService.getSongById(req.params.id);
  
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }
  
  res.json(song);
});

router.get('/:id/audio', (req, res) => {
  const filePath = musicService.getSongFilePath(req.params.id);
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mpeg'
    });
    
    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg'
    });
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
});

router.get('/:id/cover', async (req, res) => {
  const size = req.query.size || 'normal';
  
  try {
    const cover = await coverService.getCover(req.params.id, size);
    
    if (!cover) {
      return res.status(404).json({ error: 'Cover not found' });
    }
    
    res.set({
      'Content-Type': cover.format,
      'Cache-Control': 'public, max-age=31536000',
      'ETag': `${req.params.id}_${size}`
    });
    
    res.send(cover.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cover' });
  }
});

router.get('/:id/lyrics', (req, res) => {
  const lyricsPath = musicService.getSongLyricsPath(req.params.id);
  
  if (!lyricsPath || !fs.existsSync(lyricsPath)) {
    return res.status(404).json({ error: 'Lyrics not found' });
  }
  
  const lyrics = fs.readFileSync(lyricsPath, 'utf-8');
  const format = path.extname(lyricsPath).toLowerCase() === '.lrc' ? 'lrc' : 'txt';
  
  res.json({
    lyrics,
    format
  });
});

module.exports = router;
