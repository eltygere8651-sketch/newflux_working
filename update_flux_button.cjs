const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

code = code.replace(
  /Mix AI/,
  `<span className="flex items-center gap-1.5">
            <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-sm">FLUX</span>
            <Radio className="w-3.5 h-3.5 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)] animate-pulse" />
          </span>`
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
console.log("Updated button text");
