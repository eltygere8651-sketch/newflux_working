const fs = require('fs');
const file = 'src/components/GymMusicPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `              // Pre-activar el audio de respaldo 1.5 segundos antes del final para que iOS no suspenda la app
              if (durationCurrent > 3 && played >= durationCurrent - 1.5) {
                if (!hasEarlySkippedRef.current && Date.now() - lastSkipTimeRef.current > 3000) {
                  hasEarlySkippedRef.current = true;
                  if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
                    fallbackSilentAudioRef.current.play().catch(() => {});
                  }
                  // Gapless early skip to mask YouTube loading delay
                  handleNextRef.current();
                }
                return;
              }`;

const replacement = `              // Pre-activar el audio de respaldo 1.5 segundos antes del final para que iOS no suspenda la app
              if (durationCurrent > 3 && played >= durationCurrent - 1.5) {
                if (fallbackSilentAudioRef.current && fallbackSilentAudioRef.current.paused) {
                  fallbackSilentAudioRef.current.play().catch(() => {});
                }
                // REMOVED early skip to allow the song to finish completely without cutting off
              }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched Gapless successfully");
} else {
  console.log("Target Gapless not found!");
}
