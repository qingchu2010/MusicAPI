const musicService = require('../services/musicService');
const config = require('../config');

console.log('Starting music library scan...');
console.log(`Music directory: ${config.musicDir}`);

musicService.scanAndIndex()
  .then(results => {
    console.log('\nScan completed!');
    console.log(`  Added: ${results.added}`);
    console.log(`  Updated: ${results.updated}`);
    console.log(`  Errors: ${results.errors}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Scan failed:', err.message);
    process.exit(1);
  });
