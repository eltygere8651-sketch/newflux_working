const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/encodeURIComponent\(text\)/g, 'encodeURIComponent(text as string)');
fs.writeFileSync('server.ts', code);
