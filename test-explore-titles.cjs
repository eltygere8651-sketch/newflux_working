fetch('http://localhost:3000/api/youtube/explore?country=ES')
  .then(r => r.json())
  .then(d => {
     console.log("top20Tendencias:", d.top20Tendencias.map(x=>x.title));
  });
