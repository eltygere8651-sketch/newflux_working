const { Innertube } = require("youtubei.js");
async function run() {
  const yt = await Innertube.create({ gl: "ES", hl: "es" });
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(yt.music)));
}
run();
