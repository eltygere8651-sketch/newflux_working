const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  '? Number(localStorage.getItem("gym_music_saved_position")) / 1000',
  '? Number(localStorage.getItem("gym_music_saved_position"))'
);

code = code.replace(
  'const currentPosMs = state.playedSeconds * 1000;',
  'const currentPosMs = state.playedSeconds;'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
