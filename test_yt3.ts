import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Pop Music", { type: "playlist" });
  
  const playlists = (res.playlists || res.results || []).map((p: any) => ({
    id: p.id || p.playlist_id,
    title: p.title?.text || p.title?.toString(),
    author: p.author?.name || p.author || "Unknown"
  }));
  
  console.log("Playlists with raw authors:", playlists);
}
test();
