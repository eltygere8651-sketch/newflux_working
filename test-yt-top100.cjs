const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  try {
     const pl1 = await yt.music.getPlaylist("PL4fGSI1pDJn6sMPCoD7PdSlEgyUylgxuT");
     const pl2 = await yt.music.getPlaylist("PL4fGSI1pDJn4jhQB4kb9M36dvVmJQPt4T");
     
     const check = (pl, name) => {
         const idx = pl.items.findIndex(i => {
             const authorStr = i.artists?.map(a=>a.name).join(" ") || (i.flex_columns && i.flex_columns[1]?.title?.toString());
             return authorStr && authorStr.toLowerCase().includes("towers");
         });
         console.log(name, "Myke Towers at:", idx !== -1 ? idx + 1 : "Not found");
     };
     check(pl1, "Top Songs");
     check(pl2, "Top Videos");
  } catch(e) { console.log(e); }
}
run();
