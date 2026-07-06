import { Innertube } from "youtubei.js";
async function test() {
  const mx = await Innertube.create({ gl: 'MX', hl: 'es' });
  const explore = await mx.actions.execute('/browse', { browseId: 'FEmusic_explore', client: 'YTMUSIC', formData: { selectedValues: ["ES"] } });
  const contents = explore.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         console.log(c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text);
         const items = c.musicCarouselShelfRenderer.contents;
         console.log(items?.slice(0, 3).map((i:any) => i.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text));
      }
    }
  }
}
test();
