import { Innertube, UniversalCache } from 'youtubei.js';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const results = await yt.music.search("cuica ptazeta quevedo", { type: 'song' });
  console.log(results.contents?.map(c => c.type));
  // try without type
  const results2 = await yt.music.search("cuica ptazeta quevedo");
  console.log(results2.contents?.map(c => c.type));
}
run();
