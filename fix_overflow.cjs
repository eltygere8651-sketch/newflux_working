const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = 'trackListTab === "karaoke" ? "overflow-hidden pb-0"';
const replacement = 'trackListTab === "karaoke" || (trackListTab === "search" && exploreMode === "video") ? "overflow-hidden pb-0"';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("Fixed overflow-hidden for video mode");
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
} else {
    console.log("Could not find target");
}
