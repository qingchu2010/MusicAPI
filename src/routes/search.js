const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');

router.get('/', (req, res) => {
  const query = req.query.q;
  const type = req.query.type || 'song';
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  const results = musicService.searchSongs(query, type);
  res.json({
    query,
    type,
    results
  });
});

module.exports = router;
