const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace(
`      // Eco-friendly configuration: use hardware echo cancellation if available to avoid feedback loop
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();`,
`      // Optimized for low latency (no solapado) and no dropouts (no entrecortado)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext({ latencyHint: 'interactive' });`
);

if (!code.includes("Usa auriculares para evitar acoples")) {
    code = code.replace(
        `<span>Volumen Mic</span>`,
        `<span title="Usa auriculares para evitar acoples">Volumen Mic (Usa Auriculares)</span>`
    );
}

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Mic fixed for latency and dropouts");
