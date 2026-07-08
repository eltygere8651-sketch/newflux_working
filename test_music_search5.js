import { Innertube, UniversalCache } from 'youtubei.js';
async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const results = await yt.music.search("cuica ptazeta quevedo", { type: 'song' });
  const shelf = results.contents?.find(c => c.type === 'MusicShelf');
  if (shelf && shelf.contents) {
     for (const item of shelf.contents.slice(0, 2)) {
         console.log(item.type);
     }
  }
}
run();
