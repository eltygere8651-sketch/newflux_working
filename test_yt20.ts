import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const popResAlt = await yt.actions.execute('/browse', { browseId: 'FEmusic_moods_and_genres_category', params: 'ggMPOg1uXzY1RmNxSHVCdnkx', client: 'YTMUSIC' });
  const contents = popResAlt.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text?.toLowerCase() || "";
         if (header.includes("featured") || header.includes("playlist")) {
             console.log(c.musicCarouselShelfRenderer.contents[0]?.musicTwoRowItemRenderer?.title?.runs?.[0]?.text);
         }
      }
    }
  }
}
test();
