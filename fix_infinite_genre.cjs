const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

// The line to replace:
// const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(activeGenre + " playlist")}`);

const newLogic = `
          // Add random freshness modifier to make the genre query infinite and varied
          const freshnessModifiers = ["2024 playlist", "novedades", "exitos mix", "actual", "top hits", "tendencia", "mejores", "mix oficial"];
          const randomModifier = freshnessModifiers[Math.floor(Math.random() * freshnessModifiers.length)];
          const resp = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(activeGenre + " " + randomModifier)}\`);
`;

code = code.replace(/const resp = await fetch\(`\/api\/youtube\/search\?q=\$\{encodeURIComponent\(activeGenre \+ " playlist"\)\}`\);/, newLogic);

// Also shuffle the returned playlists so we don't always pick the 1st one from the results
// Replace: const playlists = data.filter((d: any) => d.isPlaylist);
// With: const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);

code = code.replace(/const playlists = data\.filter\(\(d: any\) => d\.isPlaylist\);/g, 
  'const playlists = data.filter((d: any) => d.isPlaylist).sort(() => Math.random() - 0.5);');

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Updated genre search to be infinite and fresh");
