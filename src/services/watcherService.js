const fs = require('fs');
const path = require('path');
const config = require('../config');
const { scanAndIndex } = require('./musicService');

let watchDebounce = null;

function startWatcher() {
  if (!fs.existsSync(config.musicDir)) {
    fs.mkdirSync(config.musicDir, { recursive: true });
  }

  const watcher = fs.watch(config.musicDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    const ext = path.extname(filename).toLowerCase();
    const isMusicFile = config.supportedFormats.includes(ext);
    const isCoverFile = config.coverNames.some(name => filename.endsWith(path.extname(name)));
    const isLyricsFile = ext === '.lrc' || ext === '.txt';
    
    if (isMusicFile || isCoverFile || isLyricsFile) {
      if (watchDebounce) clearTimeout(watchDebounce);
      
      watchDebounce = setTimeout(async () => {
        console.log(`[Watcher] Detected change: ${filename}`);
        try {
          const result = await scanAndIndex();
          console.log(`[Watcher] Index updated - Added: ${result.added}, Updated: ${result.updated}`);
        } catch (err) {
          console.error('[Watcher] Scan error:', err.message);
        }
      }, 1000);
    }
  });

  watcher.on('error', (err) => {
    console.error('[Watcher] Error:', err.message);
  });

  console.log(`[Watcher] Watching: ${config.musicDir}`);
  return watcher;
}

module.exports = { startWatcher };
