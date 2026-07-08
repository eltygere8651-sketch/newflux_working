import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'DE', hl: 'en' });
  const res = await yt.actions.execute('/browse', { browseId: 'FEmusic_moods_and_genres_category', params: 'ggMPOg1uXzY1RmNxSHVCdnkx', client: 'YTMUSIC' });
  const contents = res.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
        if (c.musicCarouselShelfRenderer) {
           const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
           if (header === "Featured playlists" || header === "Top-Playlists") {
               const items = c.musicCarouselShelfRenderer.contents;
               console.log("Found German Featured Playlists:", items.length);
               console.log(items[0].musicTwoRowItemRenderer?.title?.runs?.[0]?.text);
           }
        }
    }
  }
}
test();
