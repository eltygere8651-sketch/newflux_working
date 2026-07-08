async function run() {
  const start = Date.now();
  const selectedText = "¡Ey! Soy Sofía. Hoy solo pelotazos que rompen en TikTok. ¡A tope!";
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(selectedText)}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (res.ok) {
    console.log("Time taken:", Date.now() - start, "ms");
  }
}
run();
