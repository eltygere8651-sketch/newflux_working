import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("España", { type: "playlist" });
  const playlists = (res.playlists || res.results || []).filter((p:any) => p.author?.name === "YouTube Music" || p.author?.name?.includes("YouTube Music"));
  console.log(playlists.slice(0, 10).map((p:any) => p.title?.text || p.title));
}
test();
