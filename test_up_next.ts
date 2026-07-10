import { Innertube } from 'youtubei.js';

async function run() {
  const yt = await Innertube.create({ generate_session_locally: true });
  const upNext = await yt.music.getUpNext('w4qLnb2J_J0');
  console.log(upNext.contents?.[0]);
}
run();
