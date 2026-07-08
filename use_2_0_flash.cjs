const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/model: "gemini-3\.1-flash-tts-preview"/g, 'model: "gemini-2.0-flash"');
fs.writeFileSync('server.ts', code);
