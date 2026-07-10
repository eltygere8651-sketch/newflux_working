const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-[1.15]"',
    'className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-[1.15] blur-3xl opacity-40 saturate-150"'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Visuals updated for ambient video");
