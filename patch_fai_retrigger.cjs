const fs = require('fs');
const path = 'src/components/FAIView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `      if (next) {
        playedTrackIdsRef.current.add(next.id);
        onPlayTrack(next);
        setIsRadioActive(true);

        // Trigger background prefetch if buffer is running low (< 5 items)
        if (genreBuffer.length < 5) {
          prefetchMoreTracks(activeGenre);
        }
      }`,
  `      if (next) {
        playedTrackIdsRef.current.add(next.id);
        onPlayTrack(next);
        setIsRadioActive(true);

        // Trigger background prefetch if buffer is running low (< 5 items)
        if (genreBuffer.length < 5) {
          prefetchMoreTracks(activeGenre);
        }
      } else if (activeGenre !== selectedGenreRef.current) {
        setTimeout(() => setTriggerPlay(true), 50);
      }`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch_fai_retrigger.cjs');
