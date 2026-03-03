const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  musicDir: process.env.MUSIC_DIR || path.join(__dirname, '../../music'),
  dataDir: process.env.DATA_DIR || path.join(__dirname, '../../data'),
  cacheDir: process.env.CACHE_DIR || path.join(__dirname, '../../data/cache'),
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../data/music.db'),
  supportedFormats: ['.mp3', '.flac', '.m4a', '.ogg', '.wav'],
  coverNames: ['cover.jpg', 'cover.jpeg', 'cover.png', 'folder.jpg', 'folder.jpeg', 'folder.png', 'album.jpg', 'album.jpeg', 'album.png'],
  coverSizes: {
    thumbnail: 150,
    normal: 300,
    large: 600
  }
};
