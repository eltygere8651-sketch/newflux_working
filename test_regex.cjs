const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const matchSpecific = code.match(/if \(isSpecificGenre\) \{\s*(if \(genreBuffer\.length > 0\) \{[\s\S]*?\} catch\(e\) \{\n\s*console\.error\("FAI Genre search failed", e\);\n\s*\}\n\s*\})\n\s*\} else if/);

if (matchSpecific) {
  console.log("Found it. Last lines of specificBlock:");
  const lines = matchSpecific[1].split('\n');
  console.log(lines.slice(-5).join('\n'));
} else {
  console.log("Not found.");
}
