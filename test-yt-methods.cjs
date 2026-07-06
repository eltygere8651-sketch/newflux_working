const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create();
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(yt)));
}
run();
