const fs = require('fs');
const mapData = JSON.parse(fs.readFileSync('dist/server.cjs.map', 'utf8'));
console.log(mapData.sources);
