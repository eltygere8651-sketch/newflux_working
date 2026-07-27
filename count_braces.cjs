const fs = require('fs');
const code = fs.readFileSync('src/components/FAIView.tsx', 'utf8');

const matchSpecific = code.match(/if \(isSpecificGenre\) \{\s*(if \(genreBuffer\.length > 0\) \{[\s\S]*?\} catch\(e\) \{\n\s*console\.error\("FAI Genre search failed", e\);\n\s*\}\n\s*\})\n\s*\} else if/);

if (matchSpecific) {
  const text = matchSpecific[1];
  let depth = 0;
  for(let i=0; i<text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') depth--;
  }
  console.log("Depth at end of specificBlock:", depth);
} else {
  console.log("Not found");
}
