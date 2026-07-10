const fs = require('fs');
let code = fs.readFileSync('src/components/KaraokeView.tsx', 'utf8');

code = code.replace(
  'currentTrack.thumbnail || currentTrack.albumArt',
  'currentTrack.thumbnail || currentTrack.artwork_url || currentTrack.artwork'
);

fs.writeFileSync('src/components/KaraokeView.tsx', code);
console.log("Updated Karaoke image source.");
