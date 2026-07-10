const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
`      // STUDIO MODE: All hardware filters disabled for zero cutouts ("entrecortes")
      // Headphones are mandatory to prevent feedback ("solapado")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false, 
        noiseSuppression: false, 
        autoGainControl: false 
      } });`,
`      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true, // Vital to prevent feedback loops ("solapado") from speakers
        noiseSuppression: false, // Disable to prevent voice from cutting out ("entrecortado")
        autoGainControl: false, // Keep volume consistent
        channelCount: 2 // Prefer stereo if available
      } });`
);

code = code.replace(
    `🎤 ACTIVAR MICRÓFONO (REQUIERE AURICULARES)`,
    `🎤 ACTIVAR MICRÓFONO`
);
code = code.replace(
    `🎤 MICRÓFONO ACTIVO (USANDO AURICULARES)`,
    `🎤 MICRÓFONO ACTIVO`
);
code = code.replace(
    `<span title="Usa auriculares para evitar acoples">Volumen Mic (Usa Auriculares)</span>`,
    `<span>Volumen Mic</span>`
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Mic settings adjusted to fix solapado and entrecortado");
