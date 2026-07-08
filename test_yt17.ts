import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const explore = await yt.music.getExplore();
  
  for (const sec of explore.sections) {
      const items = sec.contents || sec.items || [];
      for (const item of items) {
        if (item.button_text) {
          console.log("Button:", item.button_text);
        }
      }
  }
}
test();
