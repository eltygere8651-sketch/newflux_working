import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Podcasts", { type: "playlist" });
  console.log(res.playlists?.length || res.results?.length);
  const p = res.playlists?.[0] || res.results?.[0];
  console.log(p?.title?.text || p?.title?.toString());
}
test();
