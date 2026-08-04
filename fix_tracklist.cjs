const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = '${!isTrackListExpanded && (selectedPlaylist || isPlaying || overrideCurrentTrack) && trackListTab !== "radio-fai" ? "hidden" : "flex"}';
const replacement = '${!isTrackListExpanded && (selectedPlaylist || isPlaying || overrideCurrentTrack) && trackListTab !== "radio-fai" && !(trackListTab === "search" && exploreMode === "video") ? "hidden" : "flex"}';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("Fixed TrackList hidden bug");
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
} else {
    console.log("Could not find TrackList target");
}
