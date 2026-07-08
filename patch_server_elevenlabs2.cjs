const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/radio\/welcome", async \(req, res\) => \{[\s\S]*?async function startServer\(\) \{/g;

const newWelcome = `app.get("/api/radio/welcome", async (req, res) => {
  try {
    const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
    const selectedText = SOFIA_WELCOME_PHRASES[index];

    const cacheKey = \`\${index}\`;

    if (welcomeAudioCache[cacheKey]) {
      return res.json({ text: selectedText, audio: welcomeAudioCache[cacheKey] });
    }

    console.log("[Diagnostic] Using Gemini TTS.");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        parts: [{
          text: \`Please speak the following text with an extremely energetic, high-tempo, youthful, fast-paced (under 8 seconds), cool and exciting female music DJ voice ("cañera a tope"). Use a modern, enthusiastic, and fast tempo, with a bright, dynamic Gen-Z vibe. Absolutely natural inflection, zero robotism, like a professional FM radio DJ or club host. Speak in native Spanish (Spain) with maximum power, punchy delivery, and excitement: \${selectedText}\`
        }]
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Aoede" } // Using Aoede for a good female voice
          }
        }
      }
    });

    const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    let wavBase64 = null;
    if (rawBase64) {
      const pcmBuffer = Buffer.from(rawBase64, "base64");
      const sampleRate = 24000;
      const numChannels = 1;
      const wavBuffer = Buffer.alloc(44 + pcmBuffer.length);
      wavBuffer.write('RIFF', 0);
      wavBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
      wavBuffer.write('WAVE', 8);
      wavBuffer.write('fmt ', 12);
      wavBuffer.writeUInt32LE(16, 16); 
      wavBuffer.writeUInt16LE(1, 20); 
      wavBuffer.writeUInt16LE(numChannels, 22);
      wavBuffer.writeUInt32LE(sampleRate, 24);
      wavBuffer.writeUInt32LE(sampleRate * numChannels * 2, 28); 
      wavBuffer.writeUInt16LE(numChannels * 2, 32); 
      wavBuffer.writeUInt16LE(16, 34); 
      wavBuffer.write('data', 36);
      wavBuffer.writeUInt32LE(pcmBuffer.length, 40);
      pcmBuffer.copy(wavBuffer, 44);
      
      wavBase64 = "data:audio/wav;base64," + wavBuffer.toString("base64");
      welcomeAudioCache[cacheKey] = wavBase64;
    }

    res.json({ text: selectedText, audio: wavBase64 || null });
  } catch (err: any) {
    const errStr = String(err?.message || err || "");
    console.log("[Info] Welcome audio Gemini TTS error:", errStr.slice(0, 150));
    const index = Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length);
    res.json({ text: SOFIA_WELCOME_PHRASES[index], audio: null });
  }
});

async function startServer() {`;

code = code.replace(regex, newWelcome);

// Now ensure test-voice is gone
const testVoiceRegex = /app\.get\("\/api\/radio\/test-voice", async \(req, res\) => \{[\s\S]*?\}\);\n/g;
code = code.replace(testVoiceRegex, '');

fs.writeFileSync('server.ts', code);
