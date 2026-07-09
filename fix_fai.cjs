const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

// 1. Remove handleEndWelcome and its useEffect
code = code.replace(/const handleEndWelcome = \(\) => \{[\s\S]*?handleEndWelcomeRef\.current = handleEndWelcome;\n  \}, \[currentTrack, isPlaying, onTogglePlay\]\);\n/g, '');

// 2. Rewrite handleStartWelcome
const newHandleStartWelcome = `  const handleStartWelcome = async () => {
    const targetGenre = "Radio Mix";
    setSelectedGenre(targetGenre);
    localStorage.setItem("fai_selected_genre", targetGenre);
    setGenreExploration(true);
    localStorage.setItem("fai_genre_exploration", "true");
    setGenreBuffer([]);

    setSpeaking(false);
    setIsSpeakingPaused(false);
    setIsRadioActive(true);
    setWelcomePlayed(true);
    sessionStorage.setItem("flux_radio_welcome_played_session", "true");
    
    if (handleNextTrackRef.current) {
      handleNextTrackRef.current(false);
    }
  };`;

code = code.replace(/const handleStartWelcome = async \(\) => \{[\s\S]*? \/\* Auto-start removed \*\//g, newHandleStartWelcome + '\n\n  /* Auto-start removed */');

// 3. Remove speakFallback and its associated useEffects
code = code.replace(/useEffect\(\(\) => \{\n    \/\/ ACTIVE PLAYER LOCK[\s\S]*?\}, \[volume\]\);/g, '');

// 4. Remove UI rendering of AI locution status in FAIView (like "DJ Sofía:")
code = code.replace(/\{isSpeaking && \([\s\S]*?\}\)/g, ''); // Removes the speaking block
code = code.replace(/\{welcomeStep === "speaking" && \([\s\S]*?\}\)/g, '');

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Fixed FAIView");
