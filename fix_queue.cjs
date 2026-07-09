const fs = require('fs');
const file = 'src/components/GymMusicPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  '        if (lastTab === "radio-fai") return [];',
  ''
);
fs.writeFileSync(file, code);
console.log("Fixed trackQueue in GymMusicPlayer.tsx");
