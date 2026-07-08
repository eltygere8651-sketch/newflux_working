const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  const searchRes = await yt.search("Top 50 España Spotify", { type: "video" });
  console.log("Success");
  searchRes.videos.slice(0, 5).forEach((v, idx) => {
      console.log(`${idx + 1}.`, v.title?.text || v.title?.toString(), "-", v.author?.name);
  });
}
run();
