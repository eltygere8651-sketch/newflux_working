import { Innertube } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'en' });
  const res = await yt.actions.execute('/browse', { browseId: 'FEmusic_moods_and_genres_category', params: 'ggMPOg1uXzY1RmNxSHVCdnkx', client: 'YTMUSIC' });
  
  const contents = res.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  
  if (contents) {
    for (const c of contents) {
        if (c.musicCarouselShelfRenderer) {
           const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
           if (header === "Featured playlists") {
               const items = c.musicCarouselShelfRenderer.contents;
               for (const item of items) {
                   const renderer = item.musicTwoRowItemRenderer;
                   if (renderer) {
                       console.log({
                           id: renderer.navigationEndpoint?.browseEndpoint?.browseId,
                           title: renderer.title?.runs?.[0]?.text,
                           subtitle: renderer.subtitle?.runs?.map((r:any) => r.text).join(''),
                           thumbnail: renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url
                       });
                   }
               }
           }
        }
    }
  }
}
test();
