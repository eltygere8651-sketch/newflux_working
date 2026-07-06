import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const charts = await yt.actions.execute('/browse', { browseId: 'FEmusic_charts', client: 'YTMUSIC', formData: { selectedValues: ["ES"] } });
  const contents = charts.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const items = c.musicCarouselShelfRenderer.contents;
         items?.forEach((i:any) => {
            const title = i.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text;
            const pid = i.musicResponsiveListItemRenderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.playlistId || i.musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId;
            console.log(title, pid);
         });
      }
    }
  }
}
test();
