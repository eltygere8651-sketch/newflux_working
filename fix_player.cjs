const fs = require('fs');
let file = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

file = file.replace(/useEffect\(\(\) => {\s*if \(currentTrack && currentTrack\.id\) {\s*}\s*},\s*\[currentTrack\]\);\s*/, '');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', file);
