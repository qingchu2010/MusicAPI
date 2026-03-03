const { v4: uuidv4 } = require('uuid');

function generateId() {
  return uuidv4().replace(/-/g, '').substring(0, 12);
}

module.exports = { generateId };
