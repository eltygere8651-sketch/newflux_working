const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/radio\/welcome", async \(req, res\) => \{[\s\S]*?res\.json\(\{ text: selectedText, audio: null \}\);\n\}\);/g;

const newCode = `app.get("/api/radio/welcome", async (req, res) => {
  const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
  const selectedText = SOFIA_WELCOME_PHRASES[index];
  const cacheKey = \`\${index}\`;
  
  if (welcomeAudioCache[cacheKey]) {
    return res.json({ text: selectedText, audio: welcomeAudioCache[cacheKey] });
  }

  try {
    const url = \`https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=\${encodeURIComponent(selectedText)}\`;
    const fallbackRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (fallbackRes.ok) {
      const arrayBuffer = await fallbackRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = "data:audio/mp3;base64," + buffer.toString("base64");
      welcomeAudioCache[cacheKey] = base64;
      return res.json({ text: selectedText, audio: base64 });
    }
  } catch (err) {
    console.error("Google TTS failed", err);
  }
  
  res.json({ text: selectedText, audio: null });
});`;

code = code.replace(regex, newCode);
fs.writeFileSync('server.ts', code);
