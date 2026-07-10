const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'className="opacity-0 pointer-events-none absolute w-0 h-0 overflow-hidden"',
    'className="opacity-0 pointer-events-none absolute w-[10px] h-[10px] left-[-9999px] overflow-hidden"'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("YouTube player positioned off-screen");
