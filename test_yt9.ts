import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Pop", { type: "playlist" });
  const playlists = res.playlists || res.results || [];
  console.log(util.inspect(playlists[0], { depth: 3 }));
}
test();
