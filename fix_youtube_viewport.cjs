const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'className="opacity-0 pointer-events-none absolute w-[10px] h-[10px] left-[-9999px] overflow-hidden"',
    'className="opacity-[0.01] pointer-events-none absolute inset-0 z-0 overflow-hidden"'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("YouTube player fixed viewport");
