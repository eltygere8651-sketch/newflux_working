import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.search("Top 100 Canciones España", { type: "playlist" });
  console.log(util.inspect((res.playlists || res.results || []).slice(0,3), {depth: 3}));
}
test();
