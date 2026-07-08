const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const trackSearchStr = `    trackSearch();\n`;
if (!code.includes('trackSearch();')) {
  code = code.replace(/const handleYoutubeSearch = async \(e\?: React\.FormEvent\) => {/, 'const handleYoutubeSearch = async (e?: React.FormEvent) => {\n' + trackSearchStr);
}

const trackPlaylistPlayedStr = `
    if (pl?.id && pl?.id !== 'all') {
      trackPlaylistPlayed(pl.id, pl.title || pl.name || 'Unknown Playlist');
    }
`;
if (!code.includes('trackPlaylistPlayed(pl.id')) {
  code = code.replace(/const selectPlaylist = \(pl: any\) => {/, 'const selectPlaylist = (pl: any) => {\n' + trackPlaylistPlayedStr);
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
