(async () => {
  const query = "bohemian rhapsody";
  const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'KaraokeApp/1.0.0 (https://github.com/lrclib/lrclib)'
      }
    });
  console.log("Status:", response.status);
  console.log("Body:", await response.text());
})();
