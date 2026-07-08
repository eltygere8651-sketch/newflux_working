const YoutubeMusicApi = require("youtube-music-api");
const yt = new YoutubeMusicApi();

async function run() {
  await yt.initalize();
  
  // Try to find official charts or trending for Spain
  console.log("Searching for official charts...");
  
  try {
     const searchRes = await yt.search("Top 50 España", "playlist");
     if (searchRes.content) {
         console.log(JSON.stringify(searchRes.content.slice(0, 3), null, 2));
     }
  } catch (e) {
      console.log(e);
  }
}

run();
