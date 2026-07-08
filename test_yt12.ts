import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const res = await yt.actions.execute('/browse', { browseId: 'FEmusic_moods_and_genres_category', params: 'ggMPOg1uXzY1RmNxSHVCdnkx', client: 'YTMUSIC' });
  
  // Let's print the structure of the data returned
  const tabs = res.data.contents?.singleColumnBrowseResultsRenderer?.tabs;
  console.log("Tabs:", tabs?.length);
  const contents = tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  console.log("Sections in Pop category:", contents?.length);
  
  if (contents) {
    for (const c of contents) {
        if (c.musicCarouselShelfRenderer) {
           const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
           console.log("Header:", header);
           const items = c.musicCarouselShelfRenderer.contents;
           console.log("First item:", items?.[0]?.musicTwoRowItemRenderer?.title?.runs?.[0]?.text);
        }
    }
  }
}
test();
