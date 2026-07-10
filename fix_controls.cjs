const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
    'className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"',
    'className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none"'
);

code = code.replace(
    'className="w-16 h-16 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105"',
    'className="w-16 h-16 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105 pointer-events-auto"'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Controls updated");
