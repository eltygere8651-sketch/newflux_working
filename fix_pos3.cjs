const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  'Math.abs(currentPosMs - (positionRef.current || 0)) > 5',
  'Math.abs(currentPosSec - (positionRef.current || 0)) > 5'
);

code = code.replace(
  'setPosition(currentPosMs);',
  'setPosition(currentPosSec);'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
