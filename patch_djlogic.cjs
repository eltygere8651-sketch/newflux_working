const fs = require('fs');
const file = 'src/lib/djLogic.ts';
let code = fs.readFileSync(file, 'utf8');

const target1 = `    // If no tracks found with that genre in top/favs, fallback to discovery for that genre
    if (currentTop.length === 0 && currentFavs.length === 0 && currentDisc.length === 0) {
      // In worst case, just fallback to discovery pool without strict genre but we tried
      currentDisc = discoveryPool;
    }`;

const replacement1 = `    // If no tracks found with that genre in top/favs, fallback to discovery for that genre
    if (currentTop.length === 0 && currentFavs.length === 0 && currentDisc.length === 0) {
      return null;
    }`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  fs.writeFileSync(file, code);
  console.log("Patched djLogic.ts genre fallback successfully");
} else {
  console.log("Target 1 djLogic.ts not found!");
}

const target2 = `  } else {
    // Fallback logic if some lists are empty
    let fallbackPool = [...currentTop, ...currentFavs, ...currentDisc];
    if (fallbackPool.length === 0) {
      fallbackPool = [...topTracks, ...favorites, ...discoveryPool];
    }
    if (fallbackPool.length === 0) return null;
    selected = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }`;

const replacement2 = `  } else {
    // Fallback logic if some lists are empty
    let fallbackPool = [...currentTop, ...currentFavs, ...currentDisc];
    if (fallbackPool.length === 0 && !config.genreMode) {
      fallbackPool = [...topTracks, ...favorites, ...discoveryPool];
    }
    if (fallbackPool.length === 0) return null;
    selected = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }`;

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  fs.writeFileSync(file, code);
  console.log("Patched djLogic.ts ultimate fallback successfully");
} else {
  console.log("Target 2 djLogic.ts not found!");
}

