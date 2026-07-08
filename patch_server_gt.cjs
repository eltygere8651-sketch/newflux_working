const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /    console\.log\("\[Info\] Welcome audio Gemini TTS error:", errStr\.slice\(0, 150\)\);\n    const index = Math\.floor\(Math\.random\(\) \* SOFIA_WELCOME_PHRASES\.length\);\n    res\.json\(\{ text: SOFIA_WELCOME_PHRASES\[index\], audio: null \}\);\n  \}\n\}\);/g;

const newCode = `    console.log("[Info] Welcome audio Gemini TTS error:", errStr.slice(0, 150));
    try {
      // Fallback to Google Translate TTS
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
    } catch (fallbackErr) {
      console.error("Google TTS fallback failed", fallbackErr);
    }
    
    res.json({ text: selectedText, audio: null });
  }
});`;

code = code.replace(regex, newCode);

fs.writeFileSync('server.ts', code);
