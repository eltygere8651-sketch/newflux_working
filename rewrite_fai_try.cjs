const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const startIdx = code.indexOf('    try {\n      const activeGenre = forceGenre || selectedGenre;');
const endIdx = code.indexOf('  }, [topTracks');

const newTryBlock = `    try {
      const activeGenre = forceGenre || selectedGenre;
      const total = topRatio + favRatio + discRatio;
      const wDisc = total > 0 ? discRatio / total : 0.15;
      const rand = Math.random();
      let doDiscovery = rand < wDisc;
      
      const isSpecificGenre = genreExploration && activeGenre !== "Variado Mix" && activeGenre !== "La mezcla de Sofia";

      if (!doDiscovery) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, {
          discoveryLevel,
          genreMode: isSpecificGenre,
          selectedGenre: activeGenre,
          topRatio,
          favRatio,
          discRatio: 0
        });
        if (!next) {
          doDiscovery = true;
        }
      }

      if (doDiscovery) {
        if (genreBuffer.length > 0) {
          next = genreBuffer[0];
          setGenreBuffer(prev => prev.slice(1));
        } else {
          // General youtube search logic replacing all 3 branches
          let queries = [];
          let artistLabel = "Descubrimiento";
          if (isSpecificGenre) {
            artistLabel = activeGenre;
            queries = [
              activeGenre + " novedades 2026",
              activeGenre + " exitos actuales",
              "mejores canciones " + activeGenre + " 2026",
              "top " + activeGenre + " mundial"
            ];
          } else if (genreExploration && (activeGenre === "Variado Mix" || activeGenre === "La mezcla de Sofia")) {
            artistLabel = "Variado";
            queries = [
              "reggaeton actual 2026 exitos audio oficial",
              "top canciones españa tendencia hoy hits official music video",
              "exitos pop latino 2026 oficial",
              "musica urbana españa 2026 official audio",
              "exitos reggaeton nuevo 2026 oficial video",
              "novedades musicales en español 2026",
              "los 40 principales españa 2026 hoy official audio",
              "musica variada en español 2026 exitos"
            ];
          } else {
            queries = [
              "novedades musicales pop reggaeton 2026",
              "exitos actuales en español 2026",
              "top canciones latinas mundiales 2026",
              "musica en español top hits 2026",
              "los 40 principales españa 2026 novedades",
              "mejores exitos pop urbana latina 2026"
            ];
          }

          const randomQuery = queries[Math.floor(Math.random() * queries.length)];
          try {
            const resp = await fetch("/api/youtube/search?q=" + encodeURIComponent(randomQuery));
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.length > 0) {
                const playlists = data.filter((d) => d.isPlaylist).sort(() => Math.random() - 0.5);
                let foundTracks = [];
                if (playlists.length > 0) {
                  for (let i = 0; i < Math.min(3, playlists.length); i++) {
                    const pl = playlists[i];
                    const plResp = await fetch("/api/youtube/playlist?id=" + pl.id);
                    if (plResp.ok) {
                      const plData = await plResp.json();
                      const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
                      if (tracksArray && tracksArray.length > 0) {
                        const plTracks = tracksArray.map((d) => ({
                          id: d.id,
                          title: extractCleanTitle(d.title),
                          artist: extractArtist(d.title, artistLabel, d),
                          url: d.url || ("https://www.youtube.com/watch?v=" + d.id),
                          thumbnail_url: d.thumbnail || d.thumbnail_url || ("https://i.ytimg.com/vi/" + d.id + "/hqdefault.jpg"),
                          duration: d.duration || "N/A"
                        })).filter((t) => isReasonableTrack(t.duration, t.title));
                        foundTracks = [...foundTracks, ...plTracks];
                      }
                    }
                  }
                }
                if (foundTracks.length === 0) {
                  const validData = data.filter((d) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                  if (validData.length > 0) {
                    foundTracks = validData.map((d) => ({
                      id: d.id,
                      title: extractCleanTitle(d.title),
                      artist: extractArtist(d.title, artistLabel, d),
                      url: d.url || ("https://www.youtube.com/watch?v=" + d.id),
                      thumbnail_url: d.thumbnail || d.thumbnail_url || ("https://i.ytimg.com/vi/" + d.id + "/hqdefault.jpg"),
                      duration: d.duration || "N/A"
                    }));
                  }
                }
                if (foundTracks.length > 0) {
                  const filteredTracks = foundTracks.filter(t => t.id !== currentTrack?.id);
                  const pool = filteredTracks.length > 0 ? filteredTracks : foundTracks;
                  const shuffled = pool.sort(() => Math.random() - 0.5);
                  next = shuffled[0];
                  setGenreBuffer(shuffled.slice(1));
                }
              }
            }
          } catch (e) {
            console.error("FAI YouTube search failed", e);
          }
        }
      }

      if (!next) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, { 
          discoveryLevel,
          genreMode: false,
          topRatio: 33,
          favRatio: 33,
          discRatio: 33
        });
      }

      if (next) {
        onPlayTrack(next);
        setIsRadioActive(true);
      }
    } catch (e) {
      console.error("FAI handleNextTrack failed", e);
    } finally {
      isSearchingRef.current = false;
    }
`;

code = code.substring(0, startIdx) + newTryBlock + code.substring(endIdx);
fs.writeFileSync(file, code);
console.log("Rewrote FAIView.tsx try block beautifully and safely");
