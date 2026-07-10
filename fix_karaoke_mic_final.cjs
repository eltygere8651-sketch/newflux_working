const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
`      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true, // Prevents feedback loop which causes 'solapado'
        noiseSuppression: false, // Disabling prevents 'entrecortado' (voice cutouts)
        autoGainControl: false // Prevents volume pumping
      } });`,
`      // STUDIO MODE: All hardware filters disabled for zero cutouts ("entrecortes")
      // Headphones are mandatory to prevent feedback ("solapado")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false, 
        noiseSuppression: false, 
        autoGainControl: false 
      } });`
);

if (!code.includes("REQUIERE AURICULARES")) {
    code = code.replace(
        `🎤 ACTIVAR MICRÓFONO`,
        `🎤 ACTIVAR MICRÓFONO (REQUIERE AURICULARES)`
    );
    code = code.replace(
        `🎤 MICRÓFONO ACTIVO`,
        `🎤 MICRÓFONO ACTIVO (USANDO AURICULARES)`
    );
}

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Applied final mic optimizations");
