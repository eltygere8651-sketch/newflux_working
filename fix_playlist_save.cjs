const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  '  useEffect(() => {\n    if (playingPlaylist) {\n      localStorage.setItem(\n        "gym_music_last_played_playlist_id",\n        playingPlaylist.id,\n      );',
  '  useEffect(() => {\n    if (playingPlaylist) {\n      localStorage.setItem(\n        "gym_music_last_played_playlist_id",\n        playingPlaylist.id,\n      );\n    } else {\n      localStorage.removeItem("gym_music_last_played_playlist_id");\n      localStorage.removeItem("gym_music_last_played_playlist_data");\n    }\n    if (playingPlaylist) {'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
