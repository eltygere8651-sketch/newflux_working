const { Innertube } = require('youtubei.js');
async function run() {
  const yt = await Innertube.create({ generate_session_locally: true });
  // search for a song, e.g. "blinding lights"
  const upNext = await yt.music.getUpNext("fHI8X4OXluQ");
  if (upNext.contents) {
     upNext.contents.slice(0, 10).forEach(c => {
        console.log(c.title?.text, "-", c.author || c.artists?.map(a => a.name).join(", "));
     });
  }
}
run();
