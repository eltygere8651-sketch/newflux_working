const fs = require('fs');

// 1. Update KaraokeView.tsx
let karaokeCode = fs.readFileSync('src/components/KaraokeView.tsx', 'utf8');

// Disable echo cancellation which ruins audio quality on mobile
karaokeCode = karaokeCode.replace(
  /echoCancellation: true,\s*noiseSuppression: true,\s*autoGainControl: true/,
  'echoCancellation: false,\n        noiseSuppression: false,\n        autoGainControl: false'
);

// Add Play/Pause, Next, Prev to imports
if (!karaokeCode.includes('Play,')) {
    karaokeCode = karaokeCode.replace(
      'X, Mic, MicOff, Settings2, Sliders',
      'X, Mic, MicOff, Settings2, Sliders, Play, Pause, SkipForward, SkipBack'
    );
}

// Add to props
karaokeCode = karaokeCode.replace(
  'interface KaraokeViewProps {\n  currentTrack: MusicTrack | null;\n  onClose: () => void;\n}',
  `interface KaraokeViewProps {\n  currentTrack: MusicTrack | null;\n  onClose: () => void;\n  isPlaying?: boolean;\n  onPlayPause?: () => void;\n  onNext?: () => void;\n  onPrev?: () => void;\n}`
);

karaokeCode = karaokeCode.replace(
  'export const KaraokeView: React.FC<KaraokeViewProps> = ({ currentTrack, onClose }) => {',
  'export const KaraokeView: React.FC<KaraokeViewProps> = ({ currentTrack, onClose, isPlaying, onPlayPause, onNext, onPrev }) => {'
);

// Fix settings button animation by removing height: 'auto' issue or using simple conditional rendering without AnimatePresence for height to avoid flex bugs
karaokeCode = karaokeCode.replace(
  /<AnimatePresence>[\s\S]*?\{showSettings && \([\s\S]*?<motion\.div[\s\S]*?initial=\{\{ opacity: 0, height: 0 \}\}[\s\S]*?animate=\{\{ opacity: 1, height: 'auto' \}\}[\s\S]*?exit=\{\{ opacity: 0, height: 0 \}\}[\s\S]*?className="relative z-20 px-4 sm:px-6 overflow-hidden"[\s\S]*?>/,
  `<AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-4 sm:right-6 w-64 z-[250]"
          >`
);

// Add playback controls below artwork
const controlsHtml = `
           {/* Playback Controls */}
           <div className="flex items-center gap-6 mt-6 bg-black/40 px-8 py-3 rounded-full backdrop-blur-md border border-white/10">
             <button onClick={onPrev} className="text-white/70 hover:text-white transition-colors">
               <SkipBack className="w-6 h-6 fill-current" />
             </button>
             <button onClick={onPlayPause} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform">
               {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
             </button>
             <button onClick={onNext} className="text-white/70 hover:text-white transition-colors">
               <SkipForward className="w-6 h-6 fill-current" />
             </button>
           </div>
           
           <div className="text-center w-full mt-6">`;

karaokeCode = karaokeCode.replace(
  /<div className="text-center w-full">/,
  controlsHtml
);

fs.writeFileSync('src/components/KaraokeView.tsx', karaokeCode);

// 2. Update GymMusicPlayer.tsx
let gymCode = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');
gymCode = gymCode.replace(
  /<KaraokeView[\s\S]*?onClose=\{[^}]+\}[\s\S]*?\/>/,
  `<KaraokeView 
            currentTrack={currentTrack} 
            onClose={() => setIsKaraokeMode(false)}
            isPlaying={isPlaying}
            onPlayPause={togglePlayback}
            onNext={handleNext}
            onPrev={handlePrev}
          />`
);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', gymCode);

console.log("Updated Karaoke View with Controls, Fixed Settings, and Fixed Audio Quality");
