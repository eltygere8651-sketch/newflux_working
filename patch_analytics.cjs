const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const importAnalytics = `import { initAnalytics, trackSearch, trackSongPlayed, trackPlaylistPlayed, trackExplorer, trackCommunity, trackSofiaDj, trackLogin, trackLogout } from '../lib/analytics';\n`;
if (!code.includes('import { initAnalytics')) {
  code = code.replace(/import React/, importAnalytics + 'import React');
}

// Add initAnalytics inside component
const initCall = `
  useEffect(() => {
    initAnalytics(user?.uid || null);
  }, [user]);

  useEffect(() => {
    if (currentTrack) {
      trackSongPlayed(currentTrack.id || currentTrack.url, currentTrack.title, currentTrack.artist);
    }
  }, [currentTrack?.url]);
`;
if (!code.includes('initAnalytics(user?.uid')) {
  code = code.replace(/const \[currentTrack, setCurrentTrack\] = useState/, initCall + '\n  const [currentTrack, setCurrentTrack] = useState');
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
