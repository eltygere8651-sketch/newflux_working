async function run() {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=Hola`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  console.log("Status:", res.status);
}
run();
