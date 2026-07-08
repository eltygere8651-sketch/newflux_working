import { Innertube } from 'youtubei.js';
async function test() {
   const yt = await Innertube.create();
   const res = await yt.music.search("cuica ptazeta quevedo");
   console.log(res.results?.map(r => r.contents?.map(c => c.id + ' ' + c.title + ' ' + c.duration)));
}
test();
