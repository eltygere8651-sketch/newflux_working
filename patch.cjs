const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf('try {\n      const musicResults = await yt.music.search(query, { type: \'song\' }).catch(() => null);');
const endIndex = code.indexOf('} catch (e) {}', startIndex) + '} catch (e) {}'.length;

const replacement = `try {
      const [musicGeneral, musicSongs] = await Promise.allSettled([
        yt.music.search(query).catch(() => null),
        yt.music.search(query, { type: 'song' }).catch(() => null)
      ]);

      if (musicGeneral.status === "fulfilled" && musicGeneral.value?.contents) {
        const card = musicGeneral.value.contents.find((c: any) => c.type === 'MusicCardShelf');
        if (card && card.title?.endpoint?.payload?.browseId) {
          const browseId = card.title.endpoint.payload.browseId;
          const radioId = card.buttons?.[0]?.endpoint?.payload?.playlistId || "";
          rawItems.unshift({
            type: 'ArtistProfile',
            id: browseId,
            title: card.title.text || "",
            subtitle: card.subtitle?.text || "",
            thumbnails: card.thumbnail?.contents || [],
            radioId: radioId
          });
        }
      }

      if (musicSongs.status === "fulfilled" && musicSongs.value?.contents) {
        const shelf = musicSongs.value.contents.find((c: any) => c.type === 'MusicShelf');
        if (shelf && shelf.contents) {
          const songs = shelf.contents.slice(0, 5).map((item: any) => {
            if (item.type === 'MusicResponsiveListItem') {
              return { 
                 type: 'Video',
                 id: item.id,
                 title: { text: item.title },
                 author: { name: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist' },
                 duration: { text: item.duration?.text || '' },
                 thumbnails: item.thumbnails
              };
            }
            return item;
          }).filter((x: any) => x.id);
          const artistProfileIdx = rawItems.findIndex((i: any) => i.type === 'ArtistProfile');
          if (artistProfileIdx !== -1) {
             rawItems.splice(artistProfileIdx + 1, 0, ...songs);
          } else {
             rawItems.unshift(...songs);
          }
        }
      }
    } catch (e) {}`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
fs.writeFileSync('server.ts', code);
