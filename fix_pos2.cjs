const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  'Math.abs(currentPosMs - (positionRef.current || 0)) > 5000',
  'Math.abs(currentPosMs - (positionRef.current || 0)) > 5'
);

code = code.replace(
  'const currentPosMs = state.playedSeconds;',
  'const currentPosSec = state.playedSeconds;'
);

code = code.replace(
  'currentPosMs > 0 &&',
  'currentPosSec > 0 &&'
);

code = code.replace(
  'Math.abs(currentPosSec - (positionRef.current || 0)) > 5',
  'Math.abs(currentPosSec - (positionRef.current || 0)) > 5'
);

code = code.replace(
  'positionRef.current = currentPosMs;',
  'positionRef.current = currentPosSec;'
);

code = code.replace(
  'currentPosMs.toString(),',
  'currentPosSec.toString(),'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
