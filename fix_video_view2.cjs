const fs = require('fs');
let code = fs.readFileSync('src/components/VideoView.tsx', 'utf8');

const regex = /const VIDEO_QUERIES = \[[\s\S]*?\];/;
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
  "entrevista Ibai Llanos cantantes",
  "El Hormiguero Rosalía",
  "La Resistencia Quevedo",
  "entrevista artistas urbanos",
  "curiosidades famosos reggaeton"
];`;

code = code.replace(regex, replacementQueries);
fs.writeFileSync('src/components/VideoView.tsx', code);
console.log("Replaced VIDEO_QUERIES");
