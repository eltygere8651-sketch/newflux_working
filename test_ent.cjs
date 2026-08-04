const fs = require('fs');
const code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 6930; i < 6960; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
