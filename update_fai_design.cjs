const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

// Replace the isSpeaking ternary in the Album Art section
const albumArtRegex = /\{isSpeaking \? \([\s\S]*?\) : \([\s\S]*?<motion\.img[\s\S]*?alt="Now Playing"\s*\/>\s*\)\}/g;
const newAlbumArt = `
            <div className="relative w-full h-full group">
              <motion.img
                key={currentTrack?.id || "empty"}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={albumArt}
                className="w-full h-full object-cover rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl border border-[#17d1a5]/20 relative z-10"
                alt="Now Playing"
              />
              <div className="absolute inset-0 rounded-[1.2rem] sm:rounded-[1.5rem] bg-gradient-to-t from-[#070b1a]/90 via-[#070b1a]/20 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 uppercase">FLUX AI Engine</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_8px_rgba(232,121,249,1)]" />
                </span>
              </div>
            </div>
`;
code = code.replace(albumArtRegex, newAlbumArt);

// Replace title text
code = code.replace(
  /\{isSpeaking \? "Radio Mix" : \(currentTrack\?\.title \|\| "Radio en Vivo"\)\}/g,
  `{currentTrack?.title || "FLUX AI RADIO"}`
);
code = code.replace(
  /key=\{\(isSpeaking \? "welcome" : currentTrack\?\.title\) \+ "-title"\}/g,
  `key={(currentTrack?.title) + "-title"}`
);

// Replace artist text
code = code.replace(
  /\{isSpeaking \? "Transmisión en directo" : \(currentTrack\?\.artist \|\| "Radio Mix"\)\}/g,
  `{currentTrack?.artist || "GENERATING MIX..."}`
);
code = code.replace(
  /key=\{\(isSpeaking \? "welcome" : currentTrack\?\.artist\) \+ "-artist"\}/g,
  `key={(currentTrack?.artist) + "-artist"}`
);

// Remove isSpeaking logic from displayPosition/displayDuration
code = code.replace(/const displayPosition = isSpeaking \? welcomePosition : \(position \|\| 0\);/g, 'const displayPosition = position || 0;');
code = code.replace(/const displayDuration = isSpeaking \? welcomeDuration : \(duration \|\| 0\);/g, 'const displayDuration = duration || 0;');
code = code.replace(/const showPauseIcon = isSpeaking \? \!isSpeakingPaused : \(isPlaying && isRadioActive\);/g, 'const showPauseIcon = isPlaying && isRadioActive;');

// Remove isSpeaking conditional from buttons
code = code.replace(/\$\{isSpeaking \? 'opacity-0 pointer-events-none' : ''\}/g, '');
code = code.replace(/disabled=\{isSpeaking\}/g, '');
code = code.replace(/&& \!isSpeaking/g, '');


fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated FAIView design");
