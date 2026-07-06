import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  if ((yt.music as any).getCharts) {
     const charts = await (yt.music as any).getCharts('ES');
     console.log(charts);
  } else {
     console.log("No getCharts method");
  }
}
test();
