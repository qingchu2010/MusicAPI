const { parseFile } = require('music-metadata');
const path = require('path');

async function extractMetadata(filePath) {
  try {
    const metadata = await parseFile(filePath);
    const common = metadata.common;
    
    return {
      title: common.title || path.basename(filePath, path.extname(filePath)),
      artist: common.artist || common.albumartist || 'Unknown Artist',
      album: common.album || 'Unknown Album',
      duration: Math.round(common.duration || 0),
      hasEmbeddedCover: !!(common.picture && common.picture.length > 0),
      coverFormat: common.picture && common.picture[0] ? common.picture[0].format : null
    };
  } catch (error) {
    return {
      title: path.basename(filePath, path.extname(filePath)),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
      hasEmbeddedCover: false,
      coverFormat: null
    };
  }
}

async function extractCover(filePath) {
  try {
    const metadata = await parseFile(filePath);
    const picture = metadata.common.picture;
    
    if (picture && picture.length > 0) {
      return {
        data: picture[0].data,
        format: picture[0].format
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  extractMetadata,
  extractCover
};
