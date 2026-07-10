const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'className="md:hidden absolute top-4 left-4 z-30',
    'className="md:hidden absolute top-4 left-4 z-50 pointer-events-auto'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Close button z-index fixed");
