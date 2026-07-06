const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  const res = await yt.search("Top 20 Tendencias España Oficial", { type: "playlist" });
  if (res.playlists && res.playlists.length > 0) {
      console.log(res.playlists.slice(0, 3).map(p => p.metadata?.title?.text || "Unknown").join("\n"));
  }
}
run();
