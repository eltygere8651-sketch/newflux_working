const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'className="flex-1 flex flex-col md:flex-row overflow-hidden relative"',
    'className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative"'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Added min-h-0 to main content area");
