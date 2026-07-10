const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

// Adjust left panel height on mobile to leave more room for search results
code = code.replace(
    /className=\{`w-full h-\[55vh\] md:h-auto md:flex-1 flex-col border-b md:border-b-0 md:border-r border-white\/5 relative \$\{!currentTrack \? 'hidden md:flex' : 'flex shrink-0'\}`\}/g,
    'className={`w-full h-[40vh] min-h-[250px] md:h-auto md:flex-1 flex-col border-b md:border-b-0 md:border-r border-white/5 relative ${!currentTrack ? "hidden md:flex" : "flex shrink-0"}`}'
);

// Move the X button
code = code.replace(
    '<button \n                  onClick={() => setCurrentTrack(null)}\n                  className="md:hidden absolute top-4 left-4 z-50 pointer-events-auto bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md"\n                >',
    '<button \n                  onClick={() => setCurrentTrack(null)}\n                  className="md:hidden absolute top-2 right-2 z-[99] pointer-events-auto bg-black/80 hover:bg-black text-white p-2 rounded-full backdrop-blur-md"\n                >'
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Scroll layout and X button fixed");
