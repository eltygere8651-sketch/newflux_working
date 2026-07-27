const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetWelcome = `    const handleStartWelcome = async () => {
    setGenreExploration(true);
    localStorage.setItem("fai_genre_exploration", "true");
    setGenreBuffer([]);

    setSpeaking(false);`;

const replacementWelcome = `    const handleStartWelcome = async () => {
    setSpeaking(false);`;

if (code.includes(targetWelcome)) {
  code = code.replace(targetWelcome, replacementWelcome);
  fs.writeFileSync(file, code);
  console.log("Patched Welcome successfully");
} else {
  console.log("Target Welcome not found!");
}
