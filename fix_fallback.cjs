const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const regex = /  const speakFallback = \(overrideText\?: string, reqId\?: number\) => \{[\s\S]*?  \/\/ Keep welcome audio volume in sync/g;

const newCode = `  const speakFallback = async (overrideText?: string, reqId?: number) => {
    if (reqId !== undefined && reqId !== welcomeRequestIdRef.current) {
      return;
    }
    speechStartTimeRef.current = Date.now();
    setWelcomeStep("speaking");
    setSpeaking(true);
    setIsSpeakingPaused(false);
    const textToSpeak = overrideText || welcomeText;
    
    try {
      const res = await fetch(\`/api/radio/tts?text=\${encodeURIComponent(textToSpeak)}\`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.audio) {
          const audio = new Audio(data.audio);
          welcomeAudioRef.current = audio;
          audio.volume = volume / 100;

          audio.onloadedmetadata = () => {
            if (reqId === welcomeRequestIdRef.current) {
              setWelcomeDuration(audio.duration || 0);
            }
          };

          audio.ontimeupdate = () => {
            if (reqId === welcomeRequestIdRef.current) {
              setWelcomePosition(audio.currentTime || 0);
            }
          };

          audio.onended = () => {
            if (reqId === welcomeRequestIdRef.current) {
              handleEndWelcome();
            }
          };

          audio.onerror = () => {
            if (reqId === welcomeRequestIdRef.current) {
              setTimeout(() => handleEndWelcome(), 3000);
            }
          };

          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.error("Fallback TTS fetch failed", e);
    }
    
    // If even the Google TTS proxy fails, just wait 3 seconds and continue
    setTimeout(() => {
      if (reqId === undefined || reqId === welcomeRequestIdRef.current) {
        handleEndWelcome();
      }
    }, 3000);
  };

  // Keep welcome audio volume in sync`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/components/FAIView.tsx', code);
