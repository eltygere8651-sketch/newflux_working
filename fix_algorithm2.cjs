const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const target = `    if (!next) {
      next = selectNextDJTrack(topTracks, favorites, allTracks, { 
        discoveryLevel,
        genreMode: false, // Managed externally now if active
        topRatio,
        favRatio,
        discRatio
      });
    }`;

const replacement = `    if (!next) {
      const total = topRatio + favRatio + discRatio;
      const wDisc = total > 0 ? discRatio / total : 0.50;
      const rand = Math.random();

      if (rand < wDisc) {
        if (genreBuffer.length > 0) {
          next = genreBuffer[0];
          setGenreBuffer(prev => prev.slice(1));
        } else {
          const TOP_HITS_QUERIES = [
            "novedades musicales 2024",
            "exitos actuales 2024 oficial",
            "top canciones mundiales tendencia 2024",
            "musica nueva top hits 2024",
            "los 40 principales españa 2024 novedades",
            "mejores exitos pop urbana 2024 oficial"
          ];
          const randomQuery = TOP_HITS_QUERIES[Math.floor(Math.random() * TOP_HITS_QUERIES.length)];
          try {
            const resp = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(randomQuery)}\`);
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.length > 0) {
                const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);
                let foundTracks: MusicTrack[] = [];
                if (playlists.length > 0) {
                  for (let i = 0; i < Math.min(3, playlists.length); i++) {
                    const pl = playlists[i];
                    const plResp = await fetch(\`/api/youtube/playlist?id=\${pl.id}\`);
                    if (plResp.ok) {
                      const plData = await plResp.json();
                      const tracksArray = Array.isArray(plData) ? plData : (plData.tracks || []);
                      if (tracksArray && tracksArray.length > 0) {
                        const plTracks = tracksArray.map((d: any) => ({
                          id: d.id,
                          title: extractCleanTitle(d.title),
                          artist: extractArtist(d.title, "Novedades", d),
                          url: d.url || \`https://www.youtube.com/watch?v=\${d.id}\`,
                          thumbnail_url: d.thumbnail || d.thumbnail_url || \`https://i.ytimg.com/vi/\${d.id}/hqdefault.jpg\`,
                          duration: d.duration || "N/A"
                        })).filter((t: any) => isReasonableTrack(t.duration, t.title));
                        foundTracks = [...foundTracks, ...plTracks];
                      }
                    }
                  }
                }
                if (foundTracks.length === 0) {
                  const validData = data.filter((d: any) => !d.isPlaylist && d.id && isReasonableTrack(d.duration, d.title));
                  if (validData.length > 0) {
                    foundTracks = validData.map((d: any) => ({
                      id: d.id,
                      title: extractCleanTitle(d.title),
                      artist: extractArtist(d.title, "Novedades", d),
                      url: d.url || \`https://www.youtube.com/watch?v=\${d.id}\`,
                      thumbnail_url: d.thumbnail || d.thumbnail_url || \`https://i.ytimg.com/vi/\${d.id}/hqdefault.jpg\`,
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
            console.error("FAI Algoritmo Discovery search failed", e);
          }
        }
      }

      if (!next) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, { 
          discoveryLevel,
          genreMode: false,
          topRatio,
          favRatio,
          discRatio: 0 
        });
      }
    }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FAIView.tsx', code);
  console.log("Updated FAIView.tsx algorithmic discovery successfully.");
} else {
  console.log("Could not find the target string!");
}
