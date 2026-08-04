const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const targetQueries = `const VIDEO_QUERIES = [
  "entrevista Bad Bunny 2024",
  "Quevedo concierto en vivo",
  "Shakira bizarrap session",
  "Aitana videoclip oficial",
  "Rosalia motomami tour live",
  "Rauw Alejandro entrevista",
  "Feid live performance",
  "Karol G concierto completo"
];`;

const replacementQueries = `const VIDEO_QUERIES = [
  "entrevista Bad Bunny",
  "entrevista Quevedo",
  "entrevista Rosalia",
  "entrevista Aitana",
  "entrevista Rauw Alejandro",
  "entrevista Feid",
  "entrevista Karol G",
  "entrevista Bizarrap",
  "podcast Chente Ydrach Bad Bunny",
  "entrevista Ibai Llanos",
  "El Hormiguero Rosalía",
  "La Resistencia Quevedo",
  "actualidad artistas urbanos",
  "excentricidades famosos reggaeton"
];`;

if (code.includes(targetQueries)) {
    code = code.replace(targetQueries, replacementQueries);
    console.log("Fixed VIDEO_QUERIES in VideoView");
} else {
    console.log("Could not find VIDEO_QUERIES target");
}

fs.writeFileSync('src/components/VideoView.tsx', code);
