import { Innertube } from 'youtubei.js';
async function test() {
   const yt = await Innertube.create();
   const res = await yt.music.search("cuica ptazeta quevedo");
   console.log(Object.keys(res));
   if (res.contents) console.log(res.contents.map(c => c.type));
}
test();
