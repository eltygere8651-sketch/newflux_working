const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    /src=\{`https:\/\/www\.youtube\.com\/embed\/\$\{currentTrack\.id\}\?.*?`\}/,
    'src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&controls=1&modestbranding=1&rel=0&cc_load_policy=1`}'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("iframe updated");
