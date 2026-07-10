const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

// 1. Stricter search query to force karaoke/instrumental
code = code.replace(
    'const query = `${searchQuery} Karaoke`;',
    'const query = `${searchQuery} karaoke instrumental -cover -live -official`;'
);

// 2. Change the layout of the main content area to handle mobile and show the iframe fully
code = code.replace(
`      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Player / Lyrics */}
        <div className="flex-1 flex flex-col border-r border-white/5 relative">`,
`      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Player / Lyrics (Hidden on mobile if not playing, or visible full if playing) */}
        <div className={\`flex-1 flex-col border-r border-white/5 relative \${!currentTrack ? 'hidden md:flex' : 'flex'}\`}>`
);

code = code.replace(
`          {currentTrack ? (
            <div className="flex-1 flex flex-col">
              {/* Karaoke Player View */}
              <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-emerald-900/20 blur-[100px] pointer-events-none" />
                
                {/* Embedded YouTube Player for Karaoke Audio (Invisible or minimal) */}
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={\`https://www.youtube.com/embed/\${currentTrack.id}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0\`} 
                  title="Karaoke Audio" 
                  allow="autoplay" 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ objectFit: 'cover' }}
                />
                
                <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10 relative group">
                    <img 
                      src={currentTrack.thumbnail || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop"} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4 line-clamp-2 leading-tight">
                    {currentTrack.title}
                  </h1>
                  
                  <div className="flex flex-col items-center gap-6 mt-12 w-full max-w-2xl">
                    <p className="text-xl md:text-3xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                       Preparando Letras...
                    </p>
                    <p className="text-lg text-white/40 font-medium">
                       (Letras no disponibles para esta versión instrumental)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (`,
`          {currentTrack ? (
            <div className="flex-1 flex flex-col bg-black relative">
              {/* Karaoke Player View - Full Visible Video for Lyrics */}
              <div className="flex-1 relative w-full h-full">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={\`https://www.youtube.com/embed/\${currentTrack.id}?autoplay=1&controls=1&modestbranding=1&rel=0\`} 
                  title="Karaoke Video" 
                  allow="autoplay; fullscreen" 
                  className="absolute inset-0 w-full h-full border-none"
                />
                {/* Close Button on Mobile */}
                <button 
                  onClick={() => setCurrentTrack(null)}
                  className="md:hidden absolute top-4 left-4 z-30 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (`
);

code = code.replace(
`        {/* Right: Search Results */}
        <div className="w-full md:w-[350px] bg-[#080809] flex flex-col hidden md:flex shrink-0">`,
`        {/* Right: Search Results */}
        <div className={\`w-full md:w-[350px] bg-[#080809] flex-col shrink-0 \${currentTrack ? 'hidden md:flex' : 'flex flex-1 md:flex-none'}\`}>`
);

// We need to also filter results more strictly, preferring ones with "karaoke" or "instrumental" in the title
code = code.replace(
`      const results = await response.json();
      setSearchResults(results.filter((v: any) => v.id && v.title));`,
`      const results = await response.json();
      // Filter out invalid items and try to ensure it's a karaoke/instrumental track
      const validResults = results.filter((v: any) => {
        if (!v.id || !v.title) return false;
        const titleLower = v.title.toLowerCase();
        return titleLower.includes('karaoke') || titleLower.includes('instrumental') || titleLower.includes('pista') || titleLower.includes('backing track');
      });
      // If validResults is empty but we have results, just show the normal results to avoid completely empty state if filter is too strict
      setSearchResults(validResults.length > 0 ? validResults : results.filter((v: any) => v.id && v.title));`
);


fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("FluxKaraoke search, lyrics (video), and mobile layout optimized.");
