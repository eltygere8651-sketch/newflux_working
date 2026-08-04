const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `<LazyVideoView isVisible={true} pauseBackgroundMusic={() => setIsPlaying(false)} />`;
const replacement = `<LazyVideoView isVisible={true} pauseBackgroundMusic={() => {
                          setIsPlaying(false);
                          expectedPlayingRef.current = false;
                          if (youtubePlayerRef.current) {
                            try {
                              const intPlayer =
                                youtubePlayerRef.current.getInternalPlayer();
                              if (
                                intPlayer &&
                                typeof intPlayer.pauseVideo === "function"
                              ) {
                                intPlayer.pauseVideo();
                              }
                            } catch (e) {}
                          }
                        }} />`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("Fixed pauseBackgroundMusic for LazyVideoView");
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
} else {
    console.log("Could not find LazyVideoView target");
}
