const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf-8');

const oldEffect = `  useEffect(() => {
    if (triggerPlay) {
      setTriggerPlay(false);
      handleNextTrack();
    }
  }, [triggerPlay, handleNextTrack]);`;

code = code.replace(oldEffect, '');

const oldHandleGenreSelect = `  const handleGenreSelect = (genre: string) => {
    handleGenreSelect(genre);
    setGenreBuffer([]);
    setTriggerPlay(true);
  };`;

const newHandleGenreSelect = `  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setGenreExploration(true);
    setShowGenres(false);
    setGenreBuffer([]);
    setTriggerPlay(true);
  };`;

code = code.replace(oldHandleGenreSelect, newHandleGenreSelect);

const oldHandleNextTrackEnd = `    if (!next) {
      next = selectNextDJTrack(topTracks, favorites, allTracks, { 
        discoveryLevel,
        genreMode: false // Managed externally now if active
      });
    }

    if (next) {
      onPlayTrack(next);
      setIsRadioActive(true);
    }
  }, [topTracks, favorites, allTracks, discoveryLevel, genreExploration, selectedGenre, onPlayTrack, showDJMessage, genreBuffer]);`;

const newHandleNextTrackEnd = `    if (!next) {
      next = selectNextDJTrack(topTracks, favorites, allTracks, { 
        discoveryLevel,
        genreMode: false // Managed externally now if active
      });
    }

    if (next) {
      onPlayTrack(next);
      setIsRadioActive(true);
    }
  }, [topTracks, favorites, allTracks, discoveryLevel, genreExploration, selectedGenre, onPlayTrack, showDJMessage, genreBuffer]);

  useEffect(() => {
    if (triggerPlay) {
      setTriggerPlay(false);
      handleNextTrack();
    }
  }, [triggerPlay, handleNextTrack]);`;

code = code.replace(oldHandleNextTrackEnd, newHandleNextTrackEnd);

fs.writeFileSync('src/components/FAIView.tsx', code);
