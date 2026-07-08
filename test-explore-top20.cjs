fetch('http://localhost:3000/api/youtube/explore?country=ES')
  .then(r => r.json())
  .then(d => {
    console.log("top20Tendencias length:", d.top20Tendencias?.length);
    if(d.top20Tendencias && d.top20Tendencias.length > 0) {
        d.top20Tendencias.slice(0, 5).forEach((v, i) => console.log(`${i+1}. ${v.title} - ${v.artist}`));
    }
  });
