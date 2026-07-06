import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  
  // Try to see if there's a getExplore, getMoodCategories, or something
  // In youtubei.js we can do yt.music.getExplore()
  const explore = await yt.music.getExplore();
  console.log("Explore has", explore.sections.length, "sections");
  
  // Let's see if we can get the actual Pop playlist from the official YouTube Music 'Pop' channel 
  // or search specifically for the official pop shelf.
  // We can just try to search for the official "Pop" shelf or channel
  const search = await yt.search("Pop Music", { type: "channel" });
  console.log("Channels:", search.channels?.map((c:any) => ({ id: c.id, name: c.name })).slice(0, 5));
}
test();
