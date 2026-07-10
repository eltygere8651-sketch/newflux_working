import { Innertube } from 'youtubei.js';

async function run() {
  const yt = await Innertube.create({ generate_session_locally: true });
  const musicResults = await yt.music.search('bad bunny', { type: 'song' });
  console.log(musicResults.contents?.map(c => c.type));
}
run();
