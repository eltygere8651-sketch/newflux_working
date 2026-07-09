const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(/const saved = localStorage\.getItem\("gym_music_track_queue"\);\n\s*if \(saved\) return JSON\.parse\(saved\);/g,
  'const lastTab = localStorage.getItem("gym_music_last_tab");\n        if (lastTab === "radio-fai") return [];\n        const saved = localStorage.getItem("gym_music_track_queue");\n        if (saved) return JSON.parse(saved);');

code = code.replace(/const saved = localStorage\.getItem\("gym_music_override_current_track"\);\n\s*if \(saved\) return JSON\.parse\(saved\);/g,
  'const lastTab = localStorage.getItem("gym_music_last_tab");\n        if (lastTab === "radio-fai") return null;\n        const saved = localStorage.getItem("gym_music_override_current_track");\n        if (saved) return JSON.parse(saved);');

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Fixed GymMusicPlayer restore");
