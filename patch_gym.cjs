const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const targetListTab = `"playlist" | "search" | "queue" | "entertainment" | "radio-fai" | "karaoke"`;
const replacementListTab = `"playlist" | "search" | "queue" | "entertainment" | "radio-fai" | "karaoke" | "artist"`;
code = code.replace(targetListTab, replacementListTab);

const targetMap = `{youtubeResults.map((ytTrack, idx) => {
                        const isExpanded = expandedPlaylistId === ytTrack.id;`;
const replacementMap = `{youtubeResults.map((ytTrack, idx) => {
                        if (ytTrack.type === 'ArtistProfile') {
                           return (
                             <div key={ytTrack.id} className="relative group/yt flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer mb-2" onClick={() => {
                               fetch(\`/api/youtube/artist?id=\${ytTrack.id}\`).then(r => r.json()).then(data => {
                                 setArtistDetails(data);
                               });
                               setTrackListTab("artist");
                             }}>
                                <img src={ytTrack.thumbnails[0]?.url} className="w-16 h-16 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                  <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">ARTISTA</span>
                                  <h4 className="text-[13px] font-bold text-white truncate leading-tight transition-colors uppercase tracking-tight mt-1">{ytTrack.title}</h4>
                                  <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{ytTrack.subtitle}</p>
                                </div>
                                <button className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg transition-transform hover:scale-110" onClick={(e) => {
                                  e.stopPropagation();
                                  loadPlaylistAndPlay({
                                    id: ytTrack.radioId,
                                    title: \`Radio de \${ytTrack.title}\`,
                                    isPlaylist: true,
                                    subType: "mix"
                                  });
                                }}>
                                  <Play className="w-5 h-5 text-black fill-black ml-1" />
                                </button>
                             </div>
                           );
                        }
                        const isExpanded = expandedPlaylistId === ytTrack.id;`;
code = code.replace(targetMap, replacementMap);

const targetState = `  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);`;
const replacementState = `  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);
  const [artistDetails, setArtistDetails] = useState<any>(null);`;
code = code.replace(targetState, replacementState);

fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
