const fs = require('fs');
const file = 'src/components/FAIView.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /try\s*\{\s*const activeGenre = forceGenre \|\| selectedGenre;([\s\S]*?)if \(!next\) \{\s*next = selectNextDJTrack\([\s\S]*?\}\s*\}\s*if \(next\) \{/m;

const match = code.match(regex);
if (match) {
  console.log("Found match!");
} else {
  console.log("No match");
}
