const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

// Rename Radio Mix back to SOFIA_DJ MEZCLA
code = code.replace(/Radio Mix/g, 'SOFIA_DJ MEZCLA');

// Change FAIView UI text to "FLUX AI RADIO" if needed? Wait, the user said "la mezcla de sofia" so it's fine.

// Now modify handleNextTrack to take a forced genre
code = code.replace(/const handleNextTrack = useCallback\(async \(isManualParam = false\) => \{/, 
  'const handleNextTrack = useCallback(async (isManualParam = false, forceGenre?: string) => {');

// Replace occurrences of selectedGenre with (forceGenre || selectedGenre) inside handleNextTrack
// But only inside the try block
code = code.replace(/if \(genreExploration && selectedGenre !== "Variado Mix" && selectedGenre !== "SOFIA_DJ MEZCLA"\) \{/g,
  'const activeGenre = forceGenre || selectedGenre;\n      if (genreExploration && activeGenre !== "Variado Mix" && activeGenre !== "SOFIA_DJ MEZCLA") {');

code = code.replace(/const resp = await fetch\(`\/api\/youtube\/search\?q=\$\{encodeURIComponent\(selectedGenre \+ " playlist"\)\}`\);/g,
  'const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(activeGenre + " playlist")}`);');

code = code.replace(/artist: extractArtist\(d\.title, selectedGenre, d\),/g,
  'artist: extractArtist(d.title, activeGenre, d),');

code = code.replace(/\} else if \(selectedGenre === "Variado Mix" \|\| selectedGenre === "SOFIA_DJ MEZCLA"\) \{/g,
  '} else if (activeGenre === "Variado Mix" || activeGenre === "SOFIA_DJ MEZCLA") {');

// Now update handleNextTrackRef type
code = code.replace(/const handleNextTrackRef = useRef<\(\(isManualParam\?: boolean\) => Promise<void>\) \| null>\(null\);/g,
  'const handleNextTrackRef = useRef<((isManualParam?: boolean, forceGenre?: string) => Promise<void>) | null>(null);');

// Now update handleStartWelcome to pass the target genre
code = code.replace(/if \(handleNextTrackRef\.current\) \{\n\s*handleNextTrackRef\.current\(false\);\n\s*\}/g,
  'if (handleNextTrackRef.current) {\n      handleNextTrackRef.current(false, targetGenre);\n    }');

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Bug fixed");
