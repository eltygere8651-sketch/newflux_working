const fs = require('fs');
let code = fs.readFileSync('src/components/FluxKaraoke.tsx', 'utf8');

code = code.replace('import { searchYoutube } from "../lib/youtube";', '');
code = code.replace(
    'const results = await searchYoutube(query);',
    `const response = await fetch(\`/api/youtube/search?q=\${encodeURIComponent(query)}\`);
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();`
);

fs.writeFileSync('src/components/FluxKaraoke.tsx', code);
console.log("Fixed search in FluxKaraoke");
