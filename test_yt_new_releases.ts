import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.actions.execute('/browse', { browseId: 'FEmusic_new_releases', client: 'YTMUSIC' });
  const contents = res.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
         console.log("Header:", header);
         const items = c.musicCarouselShelfRenderer.contents;
         console.log(items?.slice(0, 3).map((i:any) => i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text));
      } else if (c.musicItemIndicatorRenderer) {
         // ignore
      } else if (c.gridRenderer) {
         console.log("Grid:");
         const items = c.gridRenderer.items;
         console.log(items?.slice(0, 5).map((i:any) => i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text));
      }
    }
  }
}
test();
