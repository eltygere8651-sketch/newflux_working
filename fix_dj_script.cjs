const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const djRegex = /model: "gemini-3\.1-flash-tts-preview",\n      contents: prompt,/g;
code = code.replace(djRegex, 'model: "gemini-2.0-flash",\n      contents: prompt,');

fs.writeFileSync('server.ts', code);
