const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  const searchRes = await yt.music.search("Top Canciones España", { type: "song" });
  const songs = searchRes.contents[0].contents;
  songs.slice(0, 5).forEach((v, idx) => {
      console.log(`${idx + 1}.`, v.name);
  });
}
run();
