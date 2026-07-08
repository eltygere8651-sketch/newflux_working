const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

if (!code.includes('trackPlaylistDelete')) {
  code = code.replace(/trackLogin, trackLogout } from '\.\.\/lib\/analytics';/, 'trackLogin, trackLogout, trackPlaylistDelete } from \'../lib/analytics\';');
}

if (!code.includes('trackPlaylistDelete()')) {
  code = code.replace(/await deleteDoc\(docRef\);/, 'await deleteDoc(docRef);\n      trackPlaylistDelete();');
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
}
