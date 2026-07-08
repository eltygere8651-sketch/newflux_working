import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const explore = await yt.music.getExplore();
  
  for (const sec of explore.sections) {
    const title = sec.title?.text || sec.title?.toString() || sec.header?.title?.toString();
    if (title && (title.toLowerCase().includes("moods") || title.toLowerCase().includes("estado") || title.toLowerCase().includes("géneros"))) {
      console.log("Found Moods & genres section");
      console.log(Object.keys(sec));
      console.log("Contents:", sec.contents?.length);
      console.log("Items:", sec.items?.length);
      
      const items = sec.contents || sec.items || [];
      console.log(items.map((i:any) => i.title?.text || i.title?.toString() || i.header?.title?.toString() || i.name));
    }
  }
}
test();
