import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'US', hl: 'es' });
  const res = await yt.search("Pop", { type: "playlist" });
  const playlists = res.playlists || res.results || [];
  console.log("All Playlists:", playlists.map((p: any) => ({ title: p.title?.text || p.title?.toString(), author: p.author?.name || p.author })));
}
test();
