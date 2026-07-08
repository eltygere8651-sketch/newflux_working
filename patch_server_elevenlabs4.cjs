const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const welcomeAudioCache: Record<string, string> = \{\};[\s\S]*?app\.get\("\/api\/radio\/welcome", async \(req, res\) => \{/g;
code = code.replace(regex, 'const welcomeAudioCache: Record<string, string> = {};\n\napp.get("/api/radio/welcome", async (req, res) => {');

fs.writeFileSync('server.ts', code);
