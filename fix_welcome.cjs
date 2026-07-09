const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  '    if (handleNextTrackRef.current) {\n      handleNextTrackRef.current(false, selectedGenre);\n    }',
  `    if (handleNextTrackRef.current) {
      if (!currentTrack) {
        handleNextTrackRef.current(false, selectedGenre);
      } else {
        onTogglePlay();
      }
    }`
);

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated handleStartWelcome to not skip if track exists");
