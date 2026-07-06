import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  
  // What if we just use yt.music.getMoodCategories() or something?
  // Let's see what's on yt.music
  console.log(Object.keys(yt.music));
}
test();
