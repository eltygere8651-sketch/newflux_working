const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace('z-15', 'z-20');
code = code.replace('z-20', 'z-30'); // The playback controls
code = code.replace('z-30', 'z-40'); // The close button

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("z-index fixed");
