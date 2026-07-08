const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = `    if (playlistResults.status === "fulfilled" && playlistResults.value) {`;

const newCode = `    try {
      const musicResults = await yt.music.search(query, { type: 'song' }).catch(() => null);
      if (musicResults && musicResults.contents) {
        const shelf = musicResults.contents.find((c) => c.type === 'MusicShelf');
        if (shelf && shelf.contents) {
          const songs = shelf.contents.slice(0, 5).map((item) => {
            if (item.type === 'MusicResponsiveListItem') {
              return {
                 type: 'Video',
                 id: item.id,
                 title: { text: item.title },
                 author: { name: item.artists?.map((a) => a.name).join(', ') || 'Unknown Artist' },
                 duration: { text: item.duration?.text || '' },
                 thumbnails: item.thumbnails
              };
            }
            return item;
          }).filter(x => x.id);
          rawItems.unshift(...songs);
        }
      }
    } catch (e) {}
    
    if (playlistResults.status === "fulfilled" && playlistResults.value) {`;

code = code.replace(anchor, newCode);
fs.writeFileSync('server.ts', code);
