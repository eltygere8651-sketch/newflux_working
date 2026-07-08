const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldLogic = `      // Attempt seamless state restore
      if (
        pendingRestoreRef.current &&
        !selectedPlaylistRef.current &&
        !playingPlaylistRef.current
      ) {
        let found = folders.find((f) => f.id === pendingRestoreRef.current);
        if (!found) {
          try {
            const savedData = localStorage.getItem("gym_music_last_played_playlist_data");
            if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed && parsed.id === pendingRestoreRef.current) {
                found = parsed;
              }
            }
          } catch (e) {
            console.warn("Failed to parse saved playlist data", e);
          }
        }

        if (found) {
          setPlayingPlaylist(found);
          setSelectedPlaylist(found);
          const lastTab = localStorage.getItem("gym_music_last_tab");
          if (lastTab !== "entertainment") {
            setTrackListTab("playlist");
          }
          setMobileView("player");
          pendingRestoreRef.current = null;
        }
      }`;

const newLogic = `      // Attempt seamless state restore
      if (
        (pendingRestorePlayingRef.current || pendingRestoreSelectedRef.current) &&
        !selectedPlaylistRef.current &&
        !playingPlaylistRef.current
      ) {
        let playingFound = folders.find((f) => f.id === pendingRestorePlayingRef.current);
        let selectedFound = folders.find((f) => f.id === pendingRestoreSelectedRef.current);
        
        if (!playingFound && pendingRestorePlayingRef.current) {
          try {
            const savedData = localStorage.getItem("gym_music_last_played_playlist_data");
            if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed && parsed.id === pendingRestorePlayingRef.current) {
                playingFound = parsed;
              }
            }
          } catch (e) {
            console.warn("Failed to parse saved playlist data", e);
          }
        }

        if (playingFound) {
          setPlayingPlaylist(playingFound);
          if (!selectedFound) setSelectedPlaylist(playingFound);
        }
        
        if (selectedFound) {
          setSelectedPlaylist(selectedFound);
        }

        if (playingFound || selectedFound) {
          const lastTab = localStorage.getItem("gym_music_last_tab");
          if (lastTab !== "entertainment") {
            setTrackListTab("playlist");
          }
          if (playingFound) setMobileView("player");
          pendingRestorePlayingRef.current = null;
          pendingRestoreSelectedRef.current = null;
        }
      }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
