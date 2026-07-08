const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  try {
     const explore = await yt.music.getExplore();
     explore.sections.forEach(s => {
        console.log("Section:", s.header?.title?.toString() || s.title?.toString());
     });
  } catch(e) {}
}
run();
