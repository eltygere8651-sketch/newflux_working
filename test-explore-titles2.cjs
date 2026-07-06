const { Innertube } = require('youtubei.js');

async function test() {
  const yt = await Innertube.create({ gl: 'US', hl: 'en' });
  const res = await yt.search('Top 100 Songs Global Official', { type: "playlist" });
  console.log(res.playlists.slice(0, 10).map(p => p.title.text));
}
test();
