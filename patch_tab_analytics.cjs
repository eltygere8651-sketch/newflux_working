const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const tabEffect = `
  useEffect(() => {
    if (trackListTab === 'fai') {
      trackSofiaDj();
    } else if (trackListTab === 'explore') {
      trackExplorer();
    } else if (trackListTab === 'community') {
      trackCommunity();
    }
  }, [trackListTab]);
`;

if (!code.includes('trackExplorer();')) {
  code = code.replace(/const \[trackListTab, setTrackListTab\] = useState[^;]+;/, '$&\n' + tabEffect);
  fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
}
