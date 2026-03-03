const fs = require('fs');
const path = require('path');
const config = require('../config');

function findIndependentCover(dirPath) {
  for (const coverName of config.coverNames) {
    const coverPath = path.join(dirPath, coverName);
    if (fs.existsSync(coverPath)) {
      return coverPath;
    }
  }
  return null;
}

function findLyricsFile(audioPath) {
  const dir = path.dirname(audioPath);
  const basename = path.basename(audioPath, path.extname(audioPath));
  const lyricsExtensions = ['.lrc', '.txt'];
  
  for (const ext of lyricsExtensions) {
    const lyricsPath = path.join(dir, basename + ext);
    if (fs.existsSync(lyricsPath)) {
      return lyricsPath;
    }
  }
  return null;
}

function scanMusicDirectory(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) {
    return fileList;
  }

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanMusicDirectory(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (config.supportedFormats.includes(ext)) {
        fileList.push({
          path: filePath,
          size: stat.size,
          dir: path.dirname(filePath)
        });
      }
    }
  }
  
  return fileList;
}

module.exports = {
  findIndependentCover,
  findLyricsFile,
  scanMusicDirectory
};
