const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  try {
     const searchRes = await yt.search("Top 100 Canciones España Oficial", { type: "playlist" });
     if (searchRes.playlists && searchRes.playlists.length > 0) {
         const plId = searchRes.playlists[0].id || searchRes.playlists[0].playlist_id || searchRes.playlists[0].content_id;
         console.log("Found playlist ID:", plId);
         const pl = await yt.music.getPlaylist(plId);
         console.log("Top 5 items in playlist:");
         pl.items.slice(0, 5).forEach((i, idx) => {
             const title = i.title?.text || i.title?.toString() || (i.flex_columns && i.flex_columns[0]?.title?.toString());
             console.log(`${idx + 1}.`, title);
         });
     }
  } catch(e) { console.log(e.message); }
}
run();
