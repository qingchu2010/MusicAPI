const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const { extractCover } = require('./metadataService');

if (!fs.existsSync(config.cacheDir)) {
  fs.mkdirSync(config.cacheDir, { recursive: true });
}

async function getCover(songId, size = 'normal') {
  const musicService = require('./musicService');
  const coverInfo = musicService.getSongCoverInfo(songId);
  
  if (!coverInfo) return null;
  
  const cacheKey = `${songId}_${size}`;
  const cachePath = path.join(config.cacheDir, `${cacheKey}.webp`);
  
  if (fs.existsSync(cachePath)) {
    return {
      data: fs.readFileSync(cachePath),
      format: 'image/webp',
      cached: true
    };
  }
  
  let coverData = null;
  let coverFormat = null;
  
  if (coverInfo.independent_cover_path && fs.existsSync(coverInfo.independent_cover_path)) {
    coverData = fs.readFileSync(coverInfo.independent_cover_path);
    coverFormat = path.extname(coverInfo.independent_cover_path).toLowerCase();
  } else if (coverInfo.has_embedded_cover) {
    const embedded = await extractCover(coverInfo.file_path);
    if (embedded) {
      coverData = embedded.data;
      coverFormat = embedded.format;
    }
  }
  
  if (!coverData) return null;
  
  const targetSize = config.coverSizes[size] || config.coverSizes.normal;
  
  try {
    const optimizedBuffer = await sharp(coverData)
      .resize(targetSize, targetSize, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    
    fs.writeFileSync(cachePath, optimizedBuffer);
    
    return {
      data: optimizedBuffer,
      format: 'image/webp',
      cached: false
    };
  } catch (error) {
    return {
      data: coverData,
      format: coverFormat === 'image/png' ? 'image/png' : 'image/jpeg',
      cached: false
    };
  }
}

function clearCache(songId = null) {
  if (songId) {
    const files = fs.readdirSync(config.cacheDir).filter(f => f.startsWith(songId));
    files.forEach(f => fs.unlinkSync(path.join(config.cacheDir, f)));
  } else {
    const files = fs.readdirSync(config.cacheDir);
    files.forEach(f => fs.unlinkSync(path.join(config.cacheDir, f)));
  }
}

module.exports = {
  getCover,
  clearCache
};
