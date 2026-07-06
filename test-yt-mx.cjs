const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "MX", hl: "es" });
  try {
     const pl = await yt.music.getPlaylist("PL4fGSI1pDJn69lW8VnI9mX3O6i7G4H3Fq");
     console.log(pl.header.title.toString());
  } catch(e) { console.log(e.message); }
}
run();
