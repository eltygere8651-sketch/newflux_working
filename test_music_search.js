import { Innertube, UniversalCache } from 'youtubei.js';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const results = await yt.music.search("cuica ptazeta quevedo", { type: 'song' });
  const songs = results.contents?.firstOfType('MusicShelf')?.contents;
  if (!songs) {
     console.log("No songs found"); return;
  }
  for (const song of songs.slice(0, 5)) {
     console.log(song.id, song.title, song.duration?.text, song.artists?.map(a => a.name).join(', '));
  }
}
run();
