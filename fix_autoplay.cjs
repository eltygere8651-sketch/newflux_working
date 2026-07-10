const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'setLyricsState("loading");',
    'setLyricsState("loading");\n      setIsPlaying(false);'
);

code = code.replace(
    'const [isPlaying, setIsPlaying] = useState(true);',
    'const [isPlaying, setIsPlaying] = useState(false);'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Autoplay logic fixed");
