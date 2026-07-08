import { Innertube, UniversalCache } from 'youtubei.js';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const results = await yt.music.search("cuica ptazeta quevedo", { type: 'song' });
  const shelf = results.contents.find(c => c.type === 'MusicShelf');
  for (const song of shelf.contents.slice(0, 5)) {
     console.log(song.id, song.title, song.duration?.text, song.artists?.map(a => a.name).join(', '));
  }
}
run();
