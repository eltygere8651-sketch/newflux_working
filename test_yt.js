fetch("http://localhost:3000/api/youtube/search?q=cuica+ptazeta+quevedo").then(r => r.json()).then(data => {
    console.log(data.map(d => d.id));
}).catch(console.log)
