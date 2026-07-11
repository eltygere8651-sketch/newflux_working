const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

// The gradient class that causes readability issues
const gradientTextClass = 'font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm';
const solidTextClass = 'font-black tracking-widest text-white drop-shadow-md uppercase';

// Replace all occurrences
code = code.split(gradientTextClass).join(solidTextClass);

// Find Karaoke button and update it
const karaokeTarget = `<span className="flex items-center gap-1.5">
            <span className="font-black tracking-widest text-white drop-shadow-md uppercase">Flux Karaoke</span>
            <Mic className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </span>`;

const karaokeReplacement = `<span className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-400 rounded-full blur-[6px] animate-pulse opacity-80"></div>
              <Mic className="relative w-4 h-4 text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,1)]" />
            </div>
            <span className="font-black tracking-widest text-white drop-shadow-md uppercase">Karaoke</span>
          </span>`;

code = code.replace(karaokeTarget, karaokeReplacement);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
