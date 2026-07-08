const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf-8');

// Remove FLX RADIO FLUX MIX
const oldVisual = `            <span className="text-white/10">FLX RADIO FLUX</span>
            <span>MIX</span>`;
code = code.replace(oldVisual, '');

// Add triggerAiDj to props
code = code.replace(/  duration\?: number;\n\}/g, `  duration?: number;\n  triggerAiDj?: (context: string) => void;\n}`);
code = code.replace(/  duration,\n\}\) => \{/g, `  duration,\n  triggerAiDj,\n}) => {`);

// Call it in handleNextTrack
const oldHandleNext = `    if (next) {
      onPlayTrack(next);
      setIsRadioActive(true);
    }`;

const newHandleNext = `    if (next) {
      onPlayTrack(next);
      setIsRadioActive(true);
      if (triggerAiDj) {
        triggerAiDj(genreExploration ? selectedGenre : "Música Variada");
      }
    }`;

code = code.replace(oldHandleNext, newHandleNext);

fs.writeFileSync('src/components/FAIView.tsx', code);
