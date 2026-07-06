import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const explore = await yt.music.getExplore();
  
  for (const sec of explore.sections) {
    console.log("Section:", sec.title?.text || sec.title?.toString() || sec.header?.title?.toString());
    if (sec.header?.title?.toString().toLowerCase().includes("moods") || sec.title?.toString().toLowerCase().includes("estado")) {
      console.log("Moods items:", sec.items?.map((i:any) => i.title?.text || i.title?.toString()));
    }
  }
}
test();
