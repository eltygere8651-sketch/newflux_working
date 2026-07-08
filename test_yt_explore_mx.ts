import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'MX', hl: 'es' });
  const explore = await yt.music.getExplore();
  console.log("Sections for MX:");
  explore.sections.forEach(sec => {
     console.log(sec.header?.title?.toString() || sec.title?.toString());
     const items = sec.contents || sec.items || [];
     console.log(items.slice(0, 3).map((i:any) => i.title?.text || i.title?.toString() || i.header?.title?.toString()));
  });
}
test();
