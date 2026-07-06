const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(/volume=\{volume \/ 100\}/g, 'volume={isDucking ? (volume / 100) * 0.15 : (volume / 100)}');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
