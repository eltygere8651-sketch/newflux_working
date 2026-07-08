import { Innertube } from 'youtubei.js';
async function test() {
   const yt = await Innertube.create();
   const res = await yt.music.search("cuica ptazeta quevedo");
   console.log(res.songs?.contents?.map(c => c.id + ' ' + c.title + ' ' + c.duration?.text));
}
test();
