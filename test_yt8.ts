import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const explore = await yt.music.getExplore();
  
  let popEndpoint: any = null;
  for (const sec of explore.sections) {
    const title = sec.title?.text || sec.title?.toString() || sec.header?.title?.toString();
    if (title && (title.toLowerCase().includes("mood") || title.toLowerCase().includes("género"))) {
      const items = sec.contents || sec.items || [];
      for (const item of items) {
        if (item.button_text && item.button_text.toLowerCase().includes("pop")) {
          console.log("Found Pop:", item.button_text, item.endpoint.payload.params);
          popEndpoint = item.endpoint;
        }
      }
    }
  }
  
  if (popEndpoint) {
    const res = await yt.actions.execute('/browse', popEndpoint.payload);
    // Let's parse the response
    const playlists = res.data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.map((c: any) => {
        return c.musicCarouselShelfRenderer?.contents?.map((i: any) => i.musicTwoRowItemRenderer?.title?.runs?.[0]?.text)
    });
    console.log(JSON.stringify(playlists, null, 2));
  }
}
test();
