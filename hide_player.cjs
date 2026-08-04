const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target1 = /\(\!selectedPlaylist && \!isPlaying && \!overrideCurrentTrack\) \|\| trackListTab === "entertainment"/;
const replacement1 = `(!selectedPlaylist && !isPlaying && !overrideCurrentTrack) || trackListTab === "entertainment" || (trackListTab === "search" && exploreMode === "video")`;

if (code.match(target1)) {
    code = code.replace(target1, replacement1);
    console.log("Success replaced player bar");
} else {
    console.log("Failed to find target1");
}

const target2 = /trackListTab !== "entertainment" &&\s*trackListTab !== "radio-fai" && \(/;
const replacement2 = `trackListTab !== "entertainment" &&
        trackListTab !== "radio-fai" &&
        !(trackListTab === "search" && exploreMode === "video") && (`;

if (code.match(target2)) {
    code = code.replace(target2, replacement2);
    console.log("Success replaced mobile mini-player");
} else {
    console.log("Failed to find target2");
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
