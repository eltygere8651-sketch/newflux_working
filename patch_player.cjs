const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const oldLogic1 = `                if (activeSegment) {
                  if (
                    activeSegment.actionType === "outro" ||
                    (durationCurrent > 0 && activeSegment.end >= durationCurrent - 3)
                  ) {
                    handleNextRef.current();
                  } else {
                    youtubePlayerRef.current.seekTo(
                      activeSegment.end,
                      "seconds",
                    );
                  }
                }`;

const newLogic1 = `                if (activeSegment) {
                  // Only go to next track if the segment essentially ends the video
                  if (durationCurrent > 0 && activeSegment.end >= durationCurrent - 10) {
                    handleNextRef.current();
                  } else {
                    youtubePlayerRef.current.seekTo(activeSegment.end, "seconds");
                  }
                }`;

const oldLogic2 = `                        if (actualSecs >= nextSegment.start - 2) {
                          if (
                            nextSegment.actionType === "outro" ||
                            (durationCurrent > 0 && nextSegment.end >= durationCurrent - 3)
                          ) {
                            handleNextRef.current();
                          } else {
                            youtubePlayerRef.current.seekTo(
                              nextSegment.end,
                              "seconds",
                            );
                          }
                        }`;

const newLogic2 = `                        if (actualSecs >= nextSegment.start - 2) {
                          if (durationCurrent > 0 && nextSegment.end >= durationCurrent - 10) {
                            handleNextRef.current();
                          } else {
                            youtubePlayerRef.current.seekTo(nextSegment.end, "seconds");
                          }
                        }`;

code = code.replace(oldLogic1, newLogic1).replace(oldLogic2, newLogic2);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
