fetch("http://localhost:3000/api/youtube/explore?country=GLOBAL")
  .then(r => r.json())
  .then(d => {
    ["top100", "trending", "dailyTop", "trends", "top20Tendencias", "dailyTopPlaylists"].forEach(key => {
      console.log(`--- ${key} ---`);
      if (d[key]) d[key].forEach(t => console.log(t.title));
    });
  })
  .catch(console.error);
