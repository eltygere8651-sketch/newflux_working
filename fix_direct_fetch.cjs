const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'fetch(`/api/lyrics/search?q=${encodeURIComponent(query)}`)',
    'fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`)'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Direct fetch enabled");
