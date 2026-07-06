const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  const searchRes = await yt.search("Top 100 Canciones España Oficial", { type: "playlist" });
  if (searchRes.playlists && searchRes.playlists.length > 0) {
      console.log(Object.keys(searchRes.playlists[0]));
      console.log(searchRes.playlists[0].type);
      console.log(JSON.stringify(searchRes.playlists[0], null, 2));
  }
}
run();
