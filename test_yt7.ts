import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const explore = await yt.music.getExplore();
  
  for (const sec of explore.sections) {
    const title = sec.title?.text || sec.title?.toString() || sec.header?.title?.toString();
    if (title && (title.toLowerCase().includes("mood") || title.toLowerCase().includes("género"))) {
      const items = sec.contents || sec.items || [];
      console.log(util.inspect(items[0], { depth: 4 }));
    }
  }
}
test();
