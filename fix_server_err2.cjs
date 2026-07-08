const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/radio\/welcome", async \(req, res\) => \{[\s\S]*?    res\.json\(\{ text: selectedText, audio: null \}\);\n  \}\n\}\);/g;

const newCode = `app.get("/api/radio/welcome", async (req, res) => {
  const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
  const selectedText = SOFIA_WELCOME_PHRASES[index];
  res.json({ text: selectedText, audio: null });
});`;

code = code.replace(regex, newCode);
fs.writeFileSync('server.ts', code);
