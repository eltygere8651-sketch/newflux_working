const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const regex1 = /  const preloadedWelcomeRef = useRef<any>\(null\);\n\n  useEffect\(\) => \{\n    fetch\("\/api\/radio\/welcome"\)\n      \.then\(res => res\.json\(\)\)\n      \.then\(data => \{\n        preloadedWelcomeRef\.current = data;\n      \}\)\n      \.catch\(\(\) => \{\}\);\n  \}, \[\]\);\n/g;

const newRef = `  const prefetchPromiseRef = useRef<Promise<any> | null>(null);

  const prefetchWelcome = () => {
    const p = fetch("/api/radio/welcome")
      .then(res => res.json())
      .catch(() => null);
    prefetchPromiseRef.current = p;
    return p;
  };

  useEffect(() => {
    prefetchWelcome();
  }, []);
`;

code = code.replace(regex1, newRef);

const fetchRegex = /    try \{\n      let data;\n      if \(preloadedWelcomeRef\.current\) \{\n        data = preloadedWelcomeRef\.current;\n        preloadedWelcomeRef\.current = null;\n        fetch\("\/api\/radio\/welcome"\)\n          \.then\(res => res\.json\(\)\)\n          \.then\(d => \{ preloadedWelcomeRef\.current = d; \}\)\n          \.catch\(\(\) => \{\}\);\n      \} else \{\n        const res = await fetch\("\/api\/radio\/welcome"\);\n        if \(res\.ok\) \{\n          data = await res\.json\(\);\n        \}\n      \}\n/g;

const newFetch = `    try {
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
`;

code = code.replace(fetchRegex, newFetch);

// Now fix speakFallback
const fallbackRegex = /  const speakFallback = \(overrideText\?: string, reqId\?: number\) => \{[\s\S]*?  \};\n\n  \/\* Auto-start removed \*\//g;

const newFallback = `  const speakFallback = (overrideText?: string, reqId?: number) => {
    if (reqId !== undefined && reqId !== welcomeRequestIdRef.current) {
      return;
    }
    speechStartTimeRef.current = Date.now();
    setWelcomeStep("speaking");
    setSpeaking(true);
    setIsSpeakingPaused(false);
    
    // Fallback: Skip browser TTS since it sounds metallic. Just wait 2 seconds.
    setTimeout(() => {
      if (reqId === undefined || reqId === welcomeRequestIdRef.current) {
        handleEndWelcome();
      }
    }, 2000);
  };

  /* Auto-start removed */`;

code = code.replace(fallbackRegex, newFallback);

// Also remove all 'speechSynthesis' in window checks
const speechSync1 = /    if \('speechSynthesis' in window\) \{\n      window\.speechSynthesis\.cancel\(\);\n      \/\/ Unlock SpeechSynthesis context for subsequent asynchronous triggers\n      try \{\n        const unlockUtterance = new SpeechSynthesisUtterance\(" "\);\n        unlockUtterance\.volume = 0;\n        window\.speechSynthesis\.speak\(unlockUtterance\);\n      \} catch \(err\) \{\}\n    \}\n/g;
code = code.replace(speechSync1, '');

const speechSync2 = /    if \('speechSynthesis' in window\) \{\n      window\.speechSynthesis\.cancel\(\);\n    \}\n/g;
code = code.replace(speechSync2, '');

const speechSync3 = /      if \('speechSynthesis' in window\) \{\n        window\.speechSynthesis\.cancel\(\);\n      \}\n/g;
code = code.replace(speechSync3, '');

fs.writeFileSync('src/components/FAIView.tsx', code);
