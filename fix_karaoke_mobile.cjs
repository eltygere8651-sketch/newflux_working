const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

// 1. Fix Right Column Flex
code = code.replace(
    'className={`w-full flex-1 md:w-[350px] bg-[#080809] flex-col overflow-hidden`}',
    'className={`w-full flex-1 md:w-[350px] bg-[#080809] flex flex-col min-h-0 overflow-hidden`}' // min-h-0 is needed for flex scrolling
);

// 2. Hide Title When Playing
const titleRegex = /<div className="absolute top-6 left-1\/2 -translate-x-1\/2 z-40 flex flex-col items-center pointer-events-none drop-shadow-2xl">/;
const titleReplacement = `<div className={\`absolute top-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none drop-shadow-2xl transition-all duration-700 \${isPlaying ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}\`}>`;
code = code.replace(titleRegex, titleReplacement);

// 3. Playback delay logic
// We want to ensure isPlaying only becomes true AFTER lyrics are found or not_found
code = code.replace(
    'onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}',
    'onClick={() => { setCurrentTrack(track); setIsPlaying(false); }}'
);

// Add useEffect to handle playback
const lyricsEffectStr = `
  // Auto-play when lyrics finish loading
  useEffect(() => {
    if (currentTrack && (lyricsState === "found" || lyricsState === "not_found")) {
      setIsPlaying(true);
    }
  }, [lyricsState, currentTrack]);
`;

code = code.replace(
    '// Microphone & Audio Engine',
    lyricsEffectStr + '\\n  // Microphone & Audio Engine'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Mobile scroll, title visibility, and playback delay fixed");
