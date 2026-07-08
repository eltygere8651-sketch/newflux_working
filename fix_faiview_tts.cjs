const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const regex = /    const SOFIA_WELCOME_PHRASES = \[[\s\S]*?    speakFallback\(phrase, myRequestId\);\n/g;

const newCode = `    try {
      let data = null;
      if (prefetchPromiseRef.current) {
        data = await prefetchPromiseRef.current;
        prefetchPromiseRef.current = null;
        prefetchWelcome(); // Start prefetching next
      } else {
        const res = await fetch("/api/radio/welcome");
        if (res.ok) {
          data = await res.json();
        }
      }

      if (myRequestId !== welcomeRequestIdRef.current) {
        return;
      }

      if (data) {
        if (myRequestId !== welcomeRequestIdRef.current) {
          return;
        }

        let currentText = welcomeText;
        if (data.text) {
          setWelcomeText(data.text);
          currentText = data.text;
        }

        if (data.audio) {
          const audioSrc = data.audio.startsWith("data:")
            ? data.audio
            : ("data:audio/mp3;base64," + data.audio);
          
          const audio = new Audio(audioSrc);
          
          if (myRequestId !== welcomeRequestIdRef.current) {
            return;
          }

          welcomeAudioRef.current = audio;
          audio.volume = volume / 100;

          audio.onloadedmetadata = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              setWelcomeDuration(audio.duration || 0);
            }
          };

          audio.ontimeupdate = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              setWelcomePosition(audio.currentTime || 0);
            }
          };

          audio.onended = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              handleEndWelcome();
            }
          };

          audio.onerror = () => {
            if (myRequestId === welcomeRequestIdRef.current) {
              speakFallback(currentText, myRequestId);
            }
          };

          audio.play().catch((e) => {
            console.error("Audio playback error, falling back", e);
            if (myRequestId === welcomeRequestIdRef.current) {
              speakFallback(currentText, myRequestId);
            }
          });
        } else {
          speakFallback(currentText, myRequestId);
        }
      } else {
        speakFallback(undefined, myRequestId);
      }
    } catch (e) {
      console.error("Welcome request failed, falling back", e);
      if (myRequestId === welcomeRequestIdRef.current) {
        speakFallback(undefined, myRequestId);
      }
    }
`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/components/FAIView.tsx', code);
