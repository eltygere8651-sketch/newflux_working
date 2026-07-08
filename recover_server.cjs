const fs = require('fs');
const mapData = JSON.parse(fs.readFileSync('dist/server.cjs.map', 'utf8'));

let serverSource = null;
for (let i = 0; i < mapData.sources.length; i++) {
  if (mapData.sources[i].includes('server.ts')) {
    serverSource = mapData.sourcesContent[i];
    break;
  }
}

if (serverSource) {
  fs.writeFileSync('server.ts', serverSource);
  console.log("RECOVERED! Length:", serverSource.split('\n').length);
} else {
  console.log("Not found in map.");
}
