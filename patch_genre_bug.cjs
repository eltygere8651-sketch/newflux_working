const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetGenreBug = `    } else if (activeGenre === "Variado Mix" || activeGenre === "La mezcla de Sofia") {`;
const replacementGenreBug = `    } else if (genreExploration && (activeGenre === "Variado Mix" || activeGenre === "La mezcla de Sofia")) {`;

if (code.includes(targetGenreBug)) {
  code = code.replace(targetGenreBug, replacementGenreBug);
  fs.writeFileSync(file, code);
  console.log("Patched Genre Bug successfully");
} else {
  console.log("Target Genre Bug not found!");
}
