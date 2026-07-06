const { Innertube } = require('youtubei.js');

async function test() {
  const yt = await Innertube.create();
  try {
     const pl = await yt.music.getPlaylist("RDCLAK5uy_m-zEtyW9EceXz8eD8X_mG78l1E7F-x5YQ");
     console.log("Title:", pl.header?.title?.text);
     console.log("Thumbnail:", pl.header?.thumbnails);
  } catch (e) {
     console.log("Error:", e.message);
  }
}
test();
