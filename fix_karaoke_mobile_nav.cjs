const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// Remove the Karaoke (Mobile) button from the bottom nav
const karaokeMobileRegex = /\{\/\*\s*Karaoke \(Mobile\)\s*\*\/\}[\s\S]*?<\/button>/;
if (karaokeMobileRegex.test(code)) {
    code = code.replace(karaokeMobileRegex, '');
    console.log("Removed Karaoke from mobile nav");
} else {
    console.log("Could not find Karaoke in mobile nav");
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
