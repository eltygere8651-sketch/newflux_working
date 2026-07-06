import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const charts = await yt.actions.execute('/browse', { browseId: 'FEmusic_charts', client: 'YTMUSIC' });
  const contents = charts.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
         console.log("Header:", header);
         const items = c.musicCarouselShelfRenderer.contents;
         console.log(items?.slice(0, 3).map((i:any) => i.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text));
      }
    }
  }
}
test();
