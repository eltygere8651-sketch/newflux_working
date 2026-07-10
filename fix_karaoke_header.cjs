const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

const regex = /\{\/\* Lyrics Overlay \*\/\}/;
const replacement = `{/* Minimal Header */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none drop-shadow-2xl">
                   <h2 className="text-xl md:text-2xl font-black text-white text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{currentTrack.title}</h2>
                   <div className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Karaoke Studio</div>
                </div>
                {/* Lyrics Overlay */}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Added header");
