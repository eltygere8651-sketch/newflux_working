const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const fetchRegex = /    try \{\n      let data = null;\n      if \(prefetchPromiseRef\.current\) \{[\s\S]*?      if \(myRequestId === welcomeRequestIdRef\.current\) \{\n        speakFallback\(undefined, myRequestId\);\n      \}\n    \}\n/g;

const newFetch = `    const SOFIA_WELCOME_PHRASES = [
      "¡Qué pasa! 🔥 Soy Sofía DJ. Traigo un set de locos, ¡sube el volumen y dale mambo! ⚡️",
      "¡Ey! ⚡️ Soy Sofía. Hoy solo pelotazos que rompen en TikTok. ¡A tope! 🎧",
      "¡Buenas! 👋 Prepárate para el subidón. ¡Soy Sofía DJ y esto va a arder! 🔥",
      "¡Al loro gente! 🎧 Sofía en directo con lo más gordo. ¡Let's go! 🚀",
      "¡Wassup! 🚀 Soy Sofía DJ. Menudo arsenal de graves traigo hoy. ¡Dale caña! 🔊",
      "¡Boom! 💯 Sofía DJ al aparato. Solo lo mejor de lo mejor. ¡Fuego puro! 🔥",
      "¿Habéis visto lo último de Rosalía? ✨ ¡Vaya locura! Pero para locura, el set que os traigo. ¡Dale! 🎧",
      "¡Hola, hola! 👋 ¿Buscando el trend de TikTok? Aquí lo tienes todo antes que nadie. ¡Siente el beat! 🔊",
      "¡Fuego puro! 🔥 Ni la inteligencia artificial pincha tan bien como yo. ¡Atento a lo que viene! ⚡️",
      "¡Qué fuerte! 🚀 Lo que te traigo hoy no está escrito. Sube el bajo que esto retumba. 🔊",
      "¡Fuego! 🔥 Dicen que la inteligencia artificial nos va a quitar el trabajo... ¡pero nadie pincha con tanto flow como yo! 🎧",
      "¡Oye! 🔊 ¿Buscando el trend de TikTok? Aquí lo tienes antes de que sea viral. ¡Dale mambo! ⚡️",
      "¡Wassup! 🚀 Se viene salseo del bueno. Ni en los mejores hilos de Twitter vas a encontrar este ritmo. 🔥",
      "¡Buenas! 👋 Sofía DJ al mando. ¿Sabías que el reggaetón es la nueva religión? Pues aquí somos muy devotos. 🔊",
      "¡Boom! 💯 Si te sientes un poco meme hoy, no te preocupes, esta música te arregla el día. ¡Let's go! 🚀",
      "¡Al loro! 🎧 ¿Has visto el video viral del gatito DJ? 🐈 Pues yo soy la versión humana y con más graves. ¡Dale! ⚡️",
      "¡Hola, hola! 👋 Ni Shakira tiene tantas ganas de revancha como yo de pinchar este pelotazo. 🔥",
      "¡Ey! ⚡️ Olvídate del algoritmo y sintoniza a la verdadera jefa. ¡Sofía DJ en directo! 🔊"
    ];
    const phrase = SOFIA_WELCOME_PHRASES[Math.floor(Math.random() * SOFIA_WELCOME_PHRASES.length)];
    setWelcomeText(phrase);
    
    // Unlock SpeechSynthesis context for subsequent asynchronous triggers
    if ('speechSynthesis' in window) {
      try {
        const unlockUtterance = new SpeechSynthesisUtterance(" ");
        unlockUtterance.volume = 0;
        window.speechSynthesis.speak(unlockUtterance);
      } catch (err) {}
    }
    
    speakFallback(phrase, myRequestId);
`;

code = code.replace(fetchRegex, newFetch);
fs.writeFileSync('src/components/FAIView.tsx', code);
