import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const popResAlt = await yt.actions.execute('/browse', { browseId: 'FEmusic_moods_and_genres_category', params: 'ggMPOg1uXzY1RmNxSHVCdnkx', client: 'YTMUSIC' });
  const contents = popResAlt.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  let len = 0;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text?.toLowerCase() || "";
         console.log("Header:", header);
         if (header.includes("playlist") || header.includes("lista") || header.includes("top") || header.includes("hit")) {
             len += c.musicCarouselShelfRenderer.contents?.length || 0;
         }
      }
    }
  }
  console.log("Found:", len);
}
test();
