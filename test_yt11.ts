import { Innertube } from "youtubei.js";
async function test() {
  const yt = await Innertube.create({ gl: 'ES', hl: 'es' });
  const proto = Object.getPrototypeOf(yt.music);
  console.log(Object.getOwnPropertyNames(proto));
}
test();
