const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  try {
     const res = await yt.actions.execute('/browse', { browseId: 'FEtrending' });
     const tabs = res.data.contents?.twoColumnBrowseResultsRenderer?.tabs;
     const trendingTab = tabs[0].tabRenderer.content.sectionListRenderer.contents;
     // Let's just dump the JSON structure of the first item to see where titles are
     const item = trendingTab[0].itemSectionRenderer.contents[0].shelfRenderer.content.expandedShelfContentsRenderer.items[0];
     console.log(JSON.stringify(item).substring(0, 500));
  } catch(e) { console.log(e.message); }
}
run();
