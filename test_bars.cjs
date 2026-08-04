const fs = require('fs');
const code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const matches = code.match(/PLAYER BAR.*?<div.*?className="([^"]+)"/s);
if (matches) {
    console.log("Player bar classes:", matches[1]);
}

const miniMatches = code.match(/Unified Spotify-Style Mobile Mini-Player.*?\{.*?\&\&(.*?)\&\& \(/s);
if (miniMatches) {
    console.log("Mini player conditions:", miniMatches[1]);
}
