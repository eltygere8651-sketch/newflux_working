const { Innertube } = require('youtubei.js');

async function test() {
  const ytMX = await Innertube.create({ gl: 'MX', hl: 'es' });
  const ytES = await Innertube.create({ gl: 'ES', hl: 'es' });
  
  const resMX = await ytMX.music.getExplore();
  const resES = await ytES.music.getExplore();
  
  console.log("MX First item ID:", resMX.sections[0]?.contents?.[0]?.id);
  console.log("ES First item ID:", resES.sections[0]?.contents?.[0]?.id);
}
test();
