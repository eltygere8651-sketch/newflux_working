const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newCode = `app.get("/api/radio/tts", async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }
  
  try {
    const url = \`https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=\${encodeURIComponent(text)}\`;
    const fallbackRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (fallbackRes.ok) {
      const arrayBuffer = await fallbackRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = "data:audio/mp3;base64," + buffer.toString("base64");
      return res.json({ audio: base64 });
    }
  } catch (err) {
    console.error("Google TTS failed", err);
  }
  
  res.json({ audio: null });
});

app.get("/api/radio/welcome", async (req, res) => {`;

code = code.replace(/app\.get\("\/api\/radio\/welcome", async \(req, res\) => \{/g, newCode);
fs.writeFileSync('server.ts', code);
