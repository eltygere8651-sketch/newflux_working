import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const explore = await yt.music.getExplore();
  
  for (const sec of explore.sections) {
    const title = sec.title?.text || sec.title?.toString() || sec.header?.title?.toString();
    if (title && (title.toLowerCase().includes("mood") || title.toLowerCase().includes("estado") || title.toLowerCase().includes("género") || title.toLowerCase().includes("episodio") || title.toLowerCase().includes("podcast"))) {
      const items = sec.contents || sec.items || [];
      for (const item of items) {
        if (item.button_text && item.button_text.toLowerCase().includes("pod")) {
          console.log("Found Podcast:", item.button_text, item.endpoint.payload.params);
        }
      }
    }
  }
}
test();
