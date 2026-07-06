const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  'if (!playlist.id || !playlist.ref?.path) return;',
  'if (!playlist.id || !(playlist as any).ref?.path) return;'
);

code = code.replace(
  'if (currentUser && playlist.ownerId === currentUser.uid) return;',
  'if (user && playlist.ownerId === user.uid) return;'
);

code = code.replace(
  'const docRef = doc(db, playlist.ref.path);',
  'const docRef = doc(db, (playlist as any).ref.path);'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
