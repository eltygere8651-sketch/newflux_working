fetch("http://localhost:3000/api/youtube/explore?country=GLOBAL")
  .then(r => r.json())
  .then(d => {
    console.log("TOP 100:");
    console.log(d.top100.map(t => t.title).join('\n'));
    console.log("TRENDING:");
    console.log(d.trending.map(t => t.title).join('\n'));
  })
  .catch(console.error);
