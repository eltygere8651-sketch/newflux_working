const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

// Replace all the Web Audio stuff and echo intensity
code = code.replace(
`  const [echoIntensity, setEchoIntensity] = useState(30);
  const [micVolume, setMicVolume] = useState(80);`,
`  const [micVolume, setMicVolume] = useState(80);`
);

code = code.replace(
`  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const feedbackGainNodeRef = useRef<GainNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);

  const initWebAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Create Delay Node for Echo
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.3; // 300ms
      delayNodeRef.current = delay;

      // Feedback for multiple echoes
      const feedback = ctx.createGain();
      feedback.gain.value = echoIntensity / 100 * 0.6; // Scale down feedback
      feedbackGainNodeRef.current = feedback;

      // Output gain
      const output = ctx.createGain();
      output.gain.value = micVolume / 100;
      outputGainNodeRef.current = output;

      // Routing
      source.connect(output); // Direct signal
      
      source.connect(delay); // To echo
      delay.connect(feedback);
      feedback.connect(delay); // Loop
      
      delay.connect(output);
      
      output.connect(ctx.destination);

      setMicEnabled(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono para el modo Karaoke.");
    }
  };`,
`  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);

  const initWebAudio = async () => {
    try {
      // Eco-friendly configuration: use hardware echo cancellation if available to avoid feedback loop
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Direct Output gain (optimized, no heavy processing)
      const output = ctx.createGain();
      output.gain.value = micVolume / 100;
      outputGainNodeRef.current = output;

      // Direct Routing
      source.connect(output);
      output.connect(ctx.destination);

      setMicEnabled(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono para el modo Karaoke.");
    }
  };`
);

code = code.replace(
`  useEffect(() => {
    if (feedbackGainNodeRef.current) {
      feedbackGainNodeRef.current.gain.value = (echoIntensity / 100) * 0.6;
    }
    if (outputGainNodeRef.current) {
      outputGainNodeRef.current.gain.value = micVolume / 100;
    }
  }, [echoIntensity, micVolume]);`,
`  useEffect(() => {
    if (outputGainNodeRef.current) {
      outputGainNodeRef.current.gain.value = micVolume / 100;
    }
  }, [micVolume]);`
);

code = code.replace(
`                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Voz & Eco
                  </h3>`,
`                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Configuración de Voz
                  </h3>`
);

code = code.replace(
`                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                      <span>Nivel de Eco</span>
                      <span>{echoIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={echoIntensity}
                      onChange={(e) => setEchoIntensity(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>`,
``
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Updated FluxKaraoke.tsx successfully");
