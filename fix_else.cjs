const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const regex = /      if \(isSpeaking\) \{[\s\S]*?      \} else \{\n        onTogglePlay\(\);\n      \}/g;

const newCode = `      if (isSpeaking) {
        if (welcomeAudioRef.current) {
          if (welcomeAudioRef.current.paused) {
            welcomeAudioRef.current.play().catch(e => console.error("Audio resume error", e));
            setIsSpeakingPaused(false);
          } else {
            welcomeAudioRef.current.pause();
            setIsSpeakingPaused(true);
          }
        }
      } else {
        onTogglePlay();
      }`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/components/FAIView.tsx', code);
