const fs = require('fs');
let code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

// Always initialize selectedGenre to SOFIA_DJ MEZCLA
code = code.replace(/const \[selectedGenre, setSelectedGenre\] = useState<string>\(\(\) => \{\n\s*return localStorage\.getItem\("fai_selected_genre"\) \|\| "SOFIA_DJ MEZCLA";\n\s*\}\);/,
  'const [selectedGenre, setSelectedGenre] = useState<string>("SOFIA_DJ MEZCLA");');

// Remove localStorage writes for fai_selected_genre
code = code.replace(/localStorage\.setItem\("fai_selected_genre", selectedGenre\);/g, '// localStorage.setItem("fai_selected_genre", selectedGenre);');
code = code.replace(/localStorage\.setItem\("fai_selected_genre", targetGenre\);/g, '// localStorage.setItem("fai_selected_genre", targetGenre);');

fs.writeFileSync('src/components/FAIView.tsx', code);
console.log("Fixed FAIView genre storage");
