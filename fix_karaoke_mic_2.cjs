const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
`      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } });`,
`      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true, // Prevents feedback loop which causes 'solapado'
        noiseSuppression: false, // Disabling prevents 'entrecortado' (voice cutouts)
        autoGainControl: false // Prevents volume pumping
      } });`
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Fixed mic settings");
