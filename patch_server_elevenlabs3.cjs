const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const testVoiceRegex = /app\.get\("\/api\/radio\/test-voice", async \(req, res\) => \{[\s\S]*?\}\);\n\napp\.get\("\/api\/radio\/welcome"/;
code = code.replace(testVoiceRegex, 'app.get("/api/radio/welcome"');

fs.writeFileSync('server.ts', code);
