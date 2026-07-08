const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Remove test-voice endpoint entirely
const testVoiceRegex = /app\.get\("\/api\/radio\/test-voice"[\s\S]*?\n\}\);\n/g;
code = code.replace(testVoiceRegex, '');

// 2. Remove ElevenLabs section from welcome endpoint
const elevenLabsWelcomeRegex = /    \/\/ Extract dynamic keys if sent from frontend[\s\S]*?\n    \/\/ Fallback to Gemini 3\.1 TTS/g;
code = code.replace(elevenLabsWelcomeRegex, '    // Using Gemini TTS');

// 3. Remove '|| null' if there's any broken fallback comment left, actually let's just make the regex exact.
