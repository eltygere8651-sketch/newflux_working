const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

if (!code.includes('import ReactPlayer')) {
    code = code.replace(
        'import { motion, AnimatePresence } from "motion/react";',
        'import { motion, AnimatePresence } from "motion/react";\nimport ReactPlayer from "react-player";'
    );
}

if (!code.includes('const [isPlaying, setIsPlaying]')) {
    code = code.replace(
        'const [currentTrack, setCurrentTrack] = useState<any>(null);',
        'const [currentTrack, setCurrentTrack] = useState<any>(null);\n  const [isPlaying, setIsPlaying] = useState(true);'
    );
}

code = code.replace(
    /onClick=\{\(\) => setCurrentTrack\(track\)\}/g,
    'onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}'
);

const regexToReplace = /\{\/\* Karaoke Player View - Full Visible Video for Lyrics \*\/\}[\s\S]*?\{\/\* Close Button on Mobile \*\//;

const replacement = `{/* Karaoke Player View - Full Visible Video for Lyrics */}
              <div className="flex-1 relative w-full h-full bg-black overflow-hidden group">
                <div className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-[1.15]">
                  <ReactPlayer
                    url={\`https://www.youtube.com/watch?v=\${currentTrack.id}\`}
                    playing={isPlaying}
                    controls={false}
                    width="100%"
                    height="100%"
                    config={{
                      youtube: {
                        playerVars: { 
                          modestbranding: 1, 
                          rel: 0, 
                          showinfo: 0, 
                          iv_load_policy: 3, 
                          fs: 0,
                          cc_load_policy: 1
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Playback Controls Overlay (Visible on Hover) */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </button>
                </div>

                {/* Overlays to hide any remaining YouTube branding edges if scale is not enough */}
                <div className="absolute bottom-0 right-0 w-32 h-16 bg-black z-30 pointer-events-none blur-xl opacity-80" />

                {/* Close Button on Mobile */`;

code = code.replace(regexToReplace, replacement);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("FluxKaraoke player updated to ReactPlayer with scale");
