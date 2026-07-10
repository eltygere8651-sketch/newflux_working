fetch("https://lrclib.net/api/search?q=hello", {
  headers: { 'User-Agent': 'KaraokeApp/1.0.0 (https://github.com/lrclib/lrclib)' }
}).then(res => res.text()).then(console.log).catch(console.error)
