async function run() {
  const url = "https://pipedapi.kavin.rocks/trending?region=ES";
  try {
     const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
     const data = await res.json();
     data.slice(0, 5).forEach((v, i) => console.log(`${i+1}. ${v.title} (${v.uploaderName})`));
  } catch(e) { console.log(e.message); }
}
run();
