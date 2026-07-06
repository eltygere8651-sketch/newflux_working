const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  const searchRes = await yt.search("Top 100 Music Videos Spain", { type: "playlist" });
  if (searchRes.playlists && searchRes.playlists.length > 0) {
      const plId = searchRes.playlists[0].id || searchRes.playlists[0].playlistId || searchRes.playlists[0].content_id;
      console.log("Found playlist ID:", plId);
      const pl = await yt.getPlaylist(plId);
      pl.items.slice(0, 5).forEach((i, idx) => {
         console.log(`${idx + 1}.`, i.title?.text || i.title?.toString(), "-", i.author?.name);
      });
  }
}
run();
