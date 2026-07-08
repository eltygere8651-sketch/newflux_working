const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

code = code.replace(
  '  const pendingRestoreRef = useRef<string | null>(\n    typeof window !== "undefined"\n      ? localStorage.getItem("gym_music_last_played_playlist_id") ||\n          localStorage.getItem("gym_music_selected_playlist_id")\n      : null,\n  );',
  '  const pendingRestorePlayingRef = useRef<string | null>(\n    typeof window !== "undefined"\n      ? localStorage.getItem("gym_music_last_played_playlist_id")\n      : null,\n  );\n  const pendingRestoreSelectedRef = useRef<string | null>(\n    typeof window !== "undefined"\n      ? localStorage.getItem("gym_music_selected_playlist_id")\n      : null,\n  );'
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
