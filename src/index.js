const express = require('express');
const path = require('path');
const config = require('./config');
const { startWatcher } = require('./services/watcherService');
const { scanAndIndex } = require('./services/musicService');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    name: 'Music API',
    version: '1.0.0',
    endpoints: {
      songs: '/api/songs',
      search: '/api/search?q=keyword'
    }
  });
});

app.use('/api/songs', require('./routes/songs'));
app.use('/api/search', require('./routes/search'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  console.log('Starting Music API...');
  
  console.log('Scanning music library...');
  try {
    const result = await scanAndIndex();
    console.log(`Initial scan: ${result.added} added, ${result.updated} updated`);
  } catch (err) {
    console.error('Initial scan failed:', err.message);
  }
  
  startWatcher();
  
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Music API running on http://0.0.0.0:${config.port}`);
    console.log(`Music directory: ${config.musicDir}`);
  });
}

start();
