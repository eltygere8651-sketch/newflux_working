const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

code = code.replace(
  'const [selectedGenre, setSelectedGenre] = useState<string>("La mezcla de Sofia");',
  `const [selectedGenre, setSelectedGenre] = useState<string>(() => {\n    return localStorage.getItem("fai_selected_genre") || "La mezcla de Sofia";\n  });`
);

code = code.replace(
  /\/\/ localStorage\.setItem\("fai_selected_genre", selectedGenre\);/g,
  'localStorage.setItem("fai_selected_genre", selectedGenre);'
);

code = code.replace(
  /\/\/ localStorage\.setItem\("fai_selected_genre", targetGenre\);/g,
  'localStorage.setItem("fai_selected_genre", targetGenre);'
);

code = code.replace(
  /\{DJ_GENRES\.filter\(g => isAdmin \|\| g !== "La mezcla de Sofia"\)\.map\(\(genre\) => \(/g,
  '{DJ_GENRES.map((genre) => ('
);

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Restored genre storage and made La mezcla de Sofia visible");
