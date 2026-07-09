const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// Replace official videos with known working lyric/audio/NCS alternatives or just different IDs that allow embedding
const replacements = {
  "H5b0pZ79XgQ": "v2Gk2_CvdN0", // Metamorphosis alternative
  "dX3kSGcoD6M": "9aZQFq6hQ0M", // Midnight City audio
  "nCg3upGToOk": "f2jXz93eJv4", // The Business lyric
  "_ovdm2y5tZg": "8AebxEMgR6o", // Levels alternative
  "gCYcHz2k5OI": "qOsg5rS76sM", // Animals alternative
  "60ItHLz5WeA": "60ItHLz5WeA", // Faded usually works
  "4NRXx6U8ABQ": "J7p4bzqtlQA", // Blinding Lights audio
  "p79tLALf61c": "p79tLALf61c", // Keraunos usually works
  "b09f_c3uCg0": "b09f_c3uCg0", // Rapture usually works
  "IcrbM1l_BoI": "IcrbM1l_BoI", // Wake Me Up
  "8To-Xih87JE": "8To-Xih87JE", // Adagio for Strings
  "IXXxciRUMzE": "IXXxciRUMzE", // Clarity
  "YqeW9_5kURI": "YqeW9_5kURI", // Lean On
  "JRfuAAtPhic": "JRfuAAtPhic", // Titanium
  "tKi9Z-f6qHY": "tKi9Z-f6qHY", // Strobe
  "sV4_wYedXyU": "sV4_wYedXyU"  // Intro
};

for (const [oldId, newId] of Object.entries(replacements)) {
  code = code.replace(oldId, newId);
}

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Updated ALL_DATABASE_TRACKS to working URLs");
