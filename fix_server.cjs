const fs = require('fs');
let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
// We need to remove lines 2254 to 2316 (0-indexed: 2253 to 2315)
lines.splice(2253, 2316 - 2254 + 1);
fs.writeFileSync('server.ts', lines.join('\n'));
