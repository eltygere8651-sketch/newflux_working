const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

const regexToReplace = /\{\/\* Karaoke Player View \*\/\}[\s\S]*?\{\/\* Right: Search Results \*\/\}/;

const replacement = `{/* Karaoke Player View - Full Visible Video for Lyrics */}
              <div className="flex-1 relative w-full h-full bg-black">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={\`https://www.youtube.com/embed/\${currentTrack.id}?autoplay=1&controls=1&modestbranding=1&rel=0\`} 
                  title="Karaoke Video" 
                  allow="autoplay; fullscreen" 
                  className="absolute inset-0 w-full h-full border-none z-10"
                />
                {/* Close Button on Mobile */}
                <button 
                  onClick={() => setCurrentTrack(null)}
                  className="md:hidden absolute top-4 left-4 z-30 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-center p-8 opacity-50">
              <Mic className="w-16 h-16 text-emerald-400 mb-6 animate-pulse opacity-50" />
              <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">
                Modo Karaoke
              </h2>
              <p className="text-sm text-slate-400 max-w-sm">
                Busca una canción arriba. Buscará automáticamente la versión instrumental o karaoke de forma independiente al reproductor principal.
              </p>
            </div>
          )}
        </div>
        {/* Right: Search Results */}`;

code = code.replace(regexToReplace, replacement);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Lyrics (video view) implemented");
