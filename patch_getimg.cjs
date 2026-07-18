const fs = require('fs');

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace `if (!track) return ""` with `if (!track) return undefined` etc.
  content = content.replace(/return "";/g, 'return undefined;');
  
  fs.writeFileSync(filepath, content);
}

patchFile('src/components/GymMusicPlayer.tsx');
patchFile('src/components/ExploreView.tsx');

