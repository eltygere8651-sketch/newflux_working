const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /model: "gemini-2\.0-flash",[\s\S]*?responseModalities: \["AUDIO"\],[\s\S]*?voiceName: "Aoede" \} \/\/ Using Aoede for a good female voice\n[\s\S]*?\}\n[\s\S]*?\}\n[\s\S]*?\}\n[\s\S]*?\}\);/g;

const newCode = `model: "gemini-3.1-flash-tts-preview",
      contents: [{
        parts: [{
          text: \`\${selectedText}\`
        }]
      }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }
          }
        }
      }
    });`;

code = code.replace(regex, newCode);

fs.writeFileSync('server.ts', code);
