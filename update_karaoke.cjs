const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

// Update player visibility
const playerRegex = /<div className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-\[1.15\] blur-3xl opacity-40 saturate-150">[\s\S]*?<\/div>/;
const playerReplacement = `<div className="opacity-0 pointer-events-none absolute w-0 h-0 overflow-hidden">
                  <ReactPlayer
                    url={\`https://www.youtube.com/watch?v=\${currentTrack.id}\`}
                    playing={isPlaying}
                    onProgress={(p) => setCurrentTime(p.playedSeconds)}
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
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black pointer-events-none" />`;
code = code.replace(playerRegex, playerReplacement);

// Update layout
const leftColRegex = /<div className=\{`flex-1 flex-col border-r border-white\/5 relative \$\{\!currentTrack \? 'hidden md:flex' : 'flex'}`\}>/;
const leftColReplacement = `<div className={\`w-full h-[55vh] md:h-auto md:flex-1 flex-col border-b md:border-b-0 md:border-r border-white/5 relative \${!currentTrack ? 'hidden md:flex' : 'flex shrink-0'}\`}>`;
code = code.replace(leftColRegex, leftColReplacement);

const rightColRegex = /<div className=\{`w-full md:w-\[350px\] bg-\[#080809\] flex-col shrink-0 \$\{currentTrack \? 'hidden md:flex' : 'flex flex-1 md:flex-none'}`\}>/;
const rightColReplacement = `<div className={\`w-full flex-1 md:w-[350px] bg-[#080809] flex-col overflow-hidden\`}>`;
code = code.replace(rightColRegex, rightColReplacement);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Karaoke updated");
