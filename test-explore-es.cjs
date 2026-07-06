const { Innertube, UniversalCache } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es", clientType: "YOUTUBE_MUSIC" });
  try {
     const explore = await yt.music.getExplore();
     const trendingSec = explore.sections.find(s => s.header?.title?.toString().toLowerCase().includes("tendencia") || s.header?.title?.toString().toLowerCase().includes("trending") || s.title?.toString().toLowerCase().includes("trending"));
     if (trendingSec) {
         console.log("Trending section found:", trendingSec.header?.title?.toString());
         const items = trendingSec.contents || trendingSec.items || [];
         items.slice(0, 5).forEach((i, idx) => {
            const title = i.title?.text || i.title?.toString() || (i.flex_columns && i.flex_columns[0]?.title?.toString());
            console.log(`${idx + 1}.`, title);
         });
     }
  } catch(e) { console.log(e); }
}
run();
