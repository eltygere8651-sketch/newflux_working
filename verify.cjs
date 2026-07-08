const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
console.log("File length:", code.split('\n').length);
