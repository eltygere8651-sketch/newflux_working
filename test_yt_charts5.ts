import { Innertube, Context } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const payload = {
    browseId: 'FEmusic_charts',
    client: 'YTMUSIC'
  };
  // The context is managed by session, let's see if there's a FormData or specific param for charts.
  // Actually, music charts has a specific params value for country!
  // But wait, the standard getExplore for ES from Innertube.create({gl: 'ES'}) might actually work for 'MX'.
  const mx = await Innertube.create({ gl: 'MX', hl: 'es' });
  const charts = await mx.actions.execute('/browse', { browseId: 'FEmusic_charts', client: 'YTMUSIC', formData: { selectedValues: ["ES"] } });
  const contents = charts.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const items = c.musicCarouselShelfRenderer.contents;
         console.log(items?.slice(0, 3).map((i:any) => i.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text));
      }
    }
  }
}
test();
