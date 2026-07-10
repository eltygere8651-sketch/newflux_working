const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    '\\n  // Microphone & Audio Engine',
    '  // Microphone & Audio Engine'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Syntax fixed");
