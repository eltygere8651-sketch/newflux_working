import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Novedades", { type: "playlist" });
  const playlists = (res.playlists || res.results || []).filter((p:any) => p.author?.name?.includes("YouTube") || p.author?.includes("YouTube"));
  console.log(playlists.map((p:any) => p.title?.text || p.title));
}
test();
