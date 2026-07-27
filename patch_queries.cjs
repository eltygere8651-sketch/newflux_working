const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetQueries = `          const TOP_HITS_QUERIES = [
            "novedades musicales 2024",
            "exitos actuales 2024 oficial",
            "top canciones mundiales tendencia 2024",
            "musica nueva top hits 2024",
            "los 40 principales españa 2024 novedades",
            "mejores exitos pop urbana 2024 oficial"
          ];`;

const replacementQueries = `          const TOP_HITS_QUERIES = genreExploration && selectedGenre && selectedGenre !== "La mezcla de Sofia" ? [
            \`\${selectedGenre} novedades 2024\`,
            \`\${selectedGenre} exitos actuales\`,
            \`mejores canciones \${selectedGenre} 2024\`,
            \`top \${selectedGenre} mundial\`
          ] : [
            "novedades musicales pop reggaeton 2024",
            "exitos actuales en español 2024",
            "top canciones latinas mundiales 2024",
            "musica en español top hits 2024",
            "los 40 principales españa 2024 novedades",
            "mejores exitos pop urbana latina 2024"
          ];`;

if (code.includes(targetQueries)) {
  code = code.replace(targetQueries, replacementQueries);
  fs.writeFileSync(file, code);
  console.log("Patched queries successfully");
} else {
  console.log("Target queries not found!");
}
