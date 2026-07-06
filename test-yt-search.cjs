const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  
  // Try to use basic info or just the api directly for the playlist
  const res = await yt.actions.execute('/browse', { browseId: 'VLPLLctZz1FdqVrSgM62-NVqxpBf9t__UvXG' });
  console.log(JSON.stringify(res.data).substring(0, 500));
}
run();
