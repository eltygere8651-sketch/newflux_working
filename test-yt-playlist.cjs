const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  try {
     const pl = await yt.getPlaylist("PLLctZz1FdqVrSgM62-NVqxpBf9t__UvXG");
     pl.items.slice(0, 5).forEach((i, idx) => {
         console.log(`${idx + 1}.`, i.title?.text || i.title?.toString(), "-", i.author?.name);
     });
  } catch(e) {}
}
run();
