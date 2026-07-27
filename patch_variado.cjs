const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetVariado = `          const TOP_HITS_QUERIES = [
            "reggaeton actual 2024 exitos audio oficial",
            "top canciones españa tendencia hoy hits official music video",
            "house super top 2024 ibiza club hits audio",
            "musica urbana españa 2024 official audio",
            "exitos reggaeton nuevo 2024 bizarrap quevedo rauw official video",
            "deep house vocal mix 2024 official music video",
            "techno house super top 2024 tomorrowland sets official",
            "los 40 principales españa 2024 hoy official audio"
          ];`;

const replacementVariado = `          const TOP_HITS_QUERIES = [
            "reggaeton actual 2024 exitos audio oficial",
            "top canciones españa tendencia hoy hits official music video",
            "exitos pop latino 2024 oficial",
            "musica urbana españa 2024 official audio",
            "exitos reggaeton nuevo 2024 oficial video",
            "novedades musicales en español 2024",
            "los 40 principales españa 2024 hoy official audio",
            "musica variada en español 2024 exitos"
          ];`;

if (code.includes(targetVariado)) {
  code = code.replace(targetVariado, replacementVariado);
  fs.writeFileSync(file, code);
  console.log("Patched Variado successfully");
} else {
  console.log("Target Variado not found!");
}
