const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

// Find the try block start
const startIdx = code.indexOf('    try {\n      const activeGenre = forceGenre || selectedGenre;');

// Find the try block end (before if (next))
const endIdx = code.indexOf('    if (next) {\n      onPlayTrack(next);');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find start or end index");
  process.exit(1);
}

const oldTryBlock = code.substring(startIdx, endIdx);

// We want to extract the three YouTube search blocks from the old block.
// 1. Specific Genre block (lines 250 - 319 approx)
// 2. Variado Mix block (lines 321 - 397 approx)
// 3. Normal Discovery block (lines 406 - 477 approx)

const matchSpecific = oldTryBlock.match(/if \(genreBuffer\.length > 0\) \{([\s\S]*?)\} catch\(e\) \{\n          console\.error\("FAI Genre search failed", e\);\n        \}\n      \}/);
const specificGenreBlock = matchSpecific ? matchSpecific[0] : null;

const matchVariado = oldTryBlock.match(/if \(genreBuffer\.length > 0\) \{([\s\S]*?)\} catch \(e\) \{\n          console\.error\("FAI Varied Mix search failed", e\);\n        \}\n      \}/);
const variadoBlock = matchVariado ? matchVariado[0] : null;

const matchNormal = oldTryBlock.match(/if \(genreBuffer\.length > 0\) \{([\s\S]*?)\} catch \(e\) \{\n            console\.error\("FAI Algoritmo Discovery search failed", e\);\n          \}\n        \}/);
const normalBlock = matchNormal ? matchNormal[0] : null;

if (!specificGenreBlock || !variadoBlock || !normalBlock) {
  console.log("Could not extract blocks!");
  process.exit(1);
}

const newTryBlock = `    try {
      const activeGenre = forceGenre || selectedGenre;
      const total = topRatio + favRatio + discRatio;
      const wDisc = total > 0 ? discRatio / total : 0.15;
      const rand = Math.random();
      let doDiscovery = rand < wDisc;
      
      const isSpecificGenre = genreExploration && activeGenre !== "Variado Mix" && activeGenre !== "La mezcla de Sofia";

      if (!doDiscovery) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, {
          discoveryLevel,
          genreMode: isSpecificGenre,
          selectedGenre: activeGenre,
          topRatio,
          favRatio,
          discRatio: 0
        });
        if (!next) {
          doDiscovery = true;
        }
      }

      if (doDiscovery) {
        if (isSpecificGenre) {
          ${specificGenreBlock}
        } else if (genreExploration && (activeGenre === "Variado Mix" || activeGenre === "La mezcla de Sofia")) {
          ${variadoBlock}
        } else {
          ${normalBlock}
        }
      }

      if (!next) {
        next = selectNextDJTrack(topTracks, favorites, allTracks, { 
          discoveryLevel,
          genreMode: false,
          topRatio: 33,
          favRatio: 33,
          discRatio: 33
        });
      }
    } catch (e) {
      console.error("FAI handleNextTrack failed", e);
    } finally {
      isSearchingRef.current = false;
    }
`;

// wait, the old try block goes all the way to `isSearchingRef.current = false; }`
const realEndIdx = code.indexOf('  }, [topTracks', startIdx);
const realOldTryBlock = code.substring(startIdx, realEndIdx);

code = code.replace(realOldTryBlock, newTryBlock);
fs.writeFileSync(file, code);
console.log("Patched FAIView.tsx logic successfully");

