fetch('https://pipedapi.smnz.de/trending?region=ES')
  .then(r => r.json())
  .then(d => {
    d.slice(0, 5).forEach((v, i) => console.log(`${i+1}. ${v.title} (${v.uploaderName})`));
  })
