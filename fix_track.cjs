const fs = require('fs');
const file = 'src/components/GymMusicPlayer.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  '        if (lastTab === "radio-fai") return null;',
  ''
);
fs.writeFileSync(file, code);
console.log("Fixed GymMusicPlayer.tsx");
