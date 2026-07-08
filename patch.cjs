const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(
  /\/\/ Fallback to SpeechSynthesis because Quota or rate-limit was hit\s+console\.log\([^)]+\);\s+setIsDucking\(false\);/,
  `// Fallback to Web Speech API because Quota or rate-limit was hit
          console.log("Gemini TTS Quota hit or missing audio. Playing Web Speech fallback.");
          const utterance = new SpeechSynthesisUtterance(data.text);
          utterance.lang = "es-ES";
          utterance.pitch = 1.3; // teenage voice
          utterance.rate = 1.1; // energetic
          
          // Try to pick a female Spanish voice
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => v.lang.startsWith("es") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("mujer") || v.name.includes("Monica") || v.name.includes("Paulina") || v.name.includes("Sabina") || v.name.includes("Helena") || v.name.includes("Laura")));
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }
          
          setIsDucking(true);
          utterance.onend = () => setIsDucking(false);
          utterance.onerror = () => setIsDucking(false);
          window.speechSynthesis.speak(utterance);`
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
