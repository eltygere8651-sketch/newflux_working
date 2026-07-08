import { Innertube, Context } from "youtubei.js";
import util from "util";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  
  // Create a custom context
  const context = JSON.parse(JSON.stringify(yt.session.context));
  context.client.gl = 'ES';
  context.client.hl = 'es';
  
  const payload = {
    browseId: 'FEmusic_charts',
    client: 'YTMUSIC',
    context: context
  };
  
  const charts = await yt.actions.execute('/browse', payload);
  const contents = charts.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (contents) {
    for (const c of contents) {
      if (c.musicCarouselShelfRenderer) {
         const header = c.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
         console.log("Header:", header);
      }
    }
  }
}
test();
